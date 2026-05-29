#################################################################################
# Eclipse Tractus-X - Software Development KIT
#
# Copyright (c) 2026 Catena-X Autonomotive Network e.V.
#
# See the NOTICE file(s) distributed with this work for additional
# information regarding copyright ownership.
#
# This program and the accompanying materials are made available under the
# terms of the Apache License, Version 2.0 which is available at
# https://www.apache.org/licenses/LICENSE-2.0.
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
# either express or implied. See the
# License for the specific language govern in permissions and limitations
# under the License.
#
# SPDX-License-Identifier: Apache-2.0
#################################################################################
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6).
## It was reviewed and tested by a human committer.

"""Step-level execution helpers — run individual steps, evaluate assertions, store outputs."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from tractusx_testlab.models import ScriptStatus, StepStatus
from tractusx_testlab.player.execution.context import StepContext
from tractusx_testlab.player.execution.monitor import ExecutionMonitor
from tractusx_testlab.player.jobs import JobManager
from tractusx_testlab.player.loading.resolver import resolve_params
from tractusx_testlab.scripting.script import TestScript
from tractusx_testlab.steps.assertions import AssertionEngine
from tractusx_testlab.models.results import AssertionResult, AssertionSummary, ScriptResult, StepResult
from tractusx_testlab.player.execution._helpers import seed_script_defaults, register_script_services
from tractusx_testlab.player.execution._phase_runners import (
    execute_setup_steps,
    execute_main_steps,
    execute_teardown_steps,
)


async def run_step(
    step_cls: type, step_def: Any, step_name: str, context: StepContext,
) -> StepResult:
    """Execute a single step and evaluate its assertions."""
    step_instance = step_cls()
    params = resolve_params(step_def.params, context)
    started_at = datetime.now(timezone.utc)

    try:
        output = await step_instance.execute(params, context, step_def)

        assertion_results: list[AssertionResult] = []
        if step_def.validate:
            assertion_results = [
                AssertionResult.model_validate(ar.model_dump())
                for ar in AssertionEngine.evaluate(step_def.validate, output, context.variables)
            ]

        finished_at = datetime.now(timezone.utc)
        failed = AssertionEngine.has_hard_failure(assertion_results)

        return StepResult(
            step_name=step_name,
            step_type=step_def.type,
            status=StepStatus.FAILED if failed else StepStatus.PASSED,
            started_at=started_at,
            finished_at=finished_at,
            duration_s=(finished_at - started_at).total_seconds(),
            output=output.value,
            request=output.request,
            response=output.response,
            assertions=assertion_results,
        )
    except (OSError, ValueError, TypeError, KeyError, RuntimeError) as exc:
        finished_at = datetime.now(timezone.utc)
        return StepResult(
            step_name=step_name,
            step_type=step_def.type,
            status=StepStatus.FAILED,
            started_at=started_at,
            finished_at=finished_at,
            duration_s=(finished_at - started_at).total_seconds(),
            error=str(exc),
        )


def store_step_outputs(
    step_def: Any, step_result: StepResult, context: StepContext,
) -> None:
    """Persist step outputs into context variables when store_in_memory is configured."""
    if step_result.output is None:
        return

    store_in_var = getattr(step_def, "store_in_variable", None)
    if store_in_var and not step_def.store_in_memory:
        # Unwrap StepOutput: store the .value so downstream @var refs get usable data
        from tractusx_testlab.steps.base import StepOutput
        output = step_result.output
        if isinstance(output, StepOutput):
            output = output.value
        context.set_variable(store_in_var, output)
        return

    if not step_def.store_in_memory:
        return

    # Reconstruct StepOutput for path resolution with aliases like response_body
    from tractusx_testlab.steps.base import StepOutput
    raw = step_result.output
    if isinstance(raw, StepOutput):
        full_output = raw
    else:
        full_output = StepOutput(
            value=raw,
            request=step_result.request,
            response=step_result.response,
        )

    for var_name, output_path in step_def.store_in_memory.items():
        if output_path == ".":
            value = full_output.value
        else:
            value = AssertionEngine.extract_path(full_output, output_path)
        context.set_variable(var_name, value)


async def run_script(
    script: TestScript,
    context: StepContext,
    job_id: str,
    monitor: ExecutionMonitor,
    jobs: JobManager,
) -> ScriptResult:
    """Execute all steps in a script sequentially (precondition → setup → main → teardown)."""
    seed_script_defaults(script, context)
    register_script_services(script, context)

    script_start = datetime.now(timezone.utc)

    from tractusx_testlab.player.execution.preconditions import execute_precondition_steps
    precondition_results, precondition_status = await execute_precondition_steps(
        script, context, job_id, monitor, jobs,
    )

    setup_results: list[StepResult] = []
    step_results: list[StepResult] = []
    if precondition_status == ScriptStatus.FAILED:
        script_status = ScriptStatus.FAILED
    else:
        setup_results, setup_status = await execute_setup_steps(
            script, context, job_id, monitor, jobs,
        )
        if setup_status == ScriptStatus.FAILED:
            script_status = ScriptStatus.FAILED
        else:
            step_results, script_status = await execute_main_steps(
                script, context, job_id, monitor, jobs,
            )

    teardown_results = await execute_teardown_steps(
        script, context, job_id, monitor,
    )

    script_end = datetime.now(timezone.utc)
    all_step_results = precondition_results + setup_results + step_results + teardown_results

    return ScriptResult(
        script_name=script.name,
        dataspace_version=script.definition.dataspace_version,
        status=script_status,
        steps=all_step_results,
        started_at=script_start,
        finished_at=script_end,
        total_duration_s=(script_end - script_start).total_seconds(),
        assertion_summary=AssertionEngine.build_summary(all_step_results),
    )
