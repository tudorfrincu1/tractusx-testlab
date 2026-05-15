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

from tractusx_sdk.extensions.testlab.models import ScriptStatus, StepStatus
from tractusx_sdk.extensions.testlab.player.execution.context import StepContext
from tractusx_sdk.extensions.testlab.player.execution.monitor import ExecutionMonitor
from tractusx_testlab.player.jobs import JobManager
from tractusx_sdk.extensions.testlab.player.loading.resolver import resolve_params
from tractusx_sdk.extensions.testlab.scripting.registry import StepRegistry
from tractusx_sdk.extensions.testlab.scripting.script import TestScript
from tractusx_sdk.extensions.testlab.steps.assertions import AssertionEngine
from tractusx_sdk.extensions.testlab.steps.conditions import ConditionEvaluator
from tractusx_testlab.models.enums import StepPhase
from tractusx_testlab.models.results import AssertionResult, AssertionSummary, ScriptResult, StepResult
from tractusx_testlab.player.execution._helpers import seed_script_defaults, register_script_services


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
        if step_def.expect:
            assertion_results = [
                AssertionResult.model_validate(ar.model_dump())
                for ar in AssertionEngine.evaluate(step_def.expect, output, context.variables)
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
    if not step_def.store_in_memory or step_result.output is None:
        return
    for var_name, output_path in step_def.store_in_memory.items():
        if output_path == ".":
            value = step_result.output
        else:
            value = AssertionEngine.extract_path(step_result.output, output_path)
        context.set_variable(var_name, value)


async def execute_setup_steps(
    script: TestScript,
    context: StepContext,
    job_id: str,
    monitor: ExecutionMonitor,
    jobs: JobManager,
) -> tuple[list[StepResult], ScriptStatus]:
    """Run setup steps; stops on first failure."""
    setup_results: list[StepResult] = []
    setup_status = ScriptStatus.COMPLETED

    for step_idx, step_def in enumerate(script.definition.setup):
        await jobs.get_pause_event(job_id).wait()
        step_name = f"{script.name}[setup:{step_idx}]:{step_def.type}"
        monitor.on_step_started(job_id, step_idx, f"setup:{step_def.type}")
        jobs.set_current_step(job_id, step_name)

        if not ConditionEvaluator.should_run(
            step_def.if_condition, setup_results, context,
        ):
            skipped = StepResult(
                step_name=step_name,
                step_type=step_def.type,
                phase=StepPhase.SETUP,
                status=StepStatus.SKIPPED,
            )
            setup_results.append(skipped)
            monitor.on_step_completed(job_id, skipped)
            continue

        step_cls = StepRegistry.get(step_def.type, script.definition.version)
        if step_cls is None:
            missing_step = StepResult(
                step_name=step_name,
                step_type=step_def.type,
                phase=StepPhase.SETUP,
                status=StepStatus.FAILED,
                error=f"No implementation found for setup step type '{step_def.type}'",
            )
            setup_results.append(missing_step)
            return setup_results, ScriptStatus.FAILED

        step_result = await run_step(step_cls, step_def, step_name, context)
        step_result.phase = StepPhase.SETUP
        setup_results.append(step_result)
        monitor.on_step_completed(job_id, step_result)

        store_step_outputs(step_def, step_result, context)

        if step_result.status == StepStatus.FAILED:
            return setup_results, ScriptStatus.FAILED

    return setup_results, setup_status


async def execute_main_steps(
    script: TestScript,
    context: StepContext,
    job_id: str,
    monitor: ExecutionMonitor,
    jobs: JobManager,
) -> tuple[list[StepResult], ScriptStatus]:
    """Run the main step sequence, stopping on first failure."""
    step_results: list[StepResult] = []
    script_status = ScriptStatus.COMPLETED

    for step_idx, step_def in enumerate(script.definition.steps):
        await jobs.get_pause_event(job_id).wait()
        step_name = f"{script.name}[{step_idx}]:{step_def.type}"
        monitor.on_step_started(job_id, step_idx, step_def.type)
        jobs.set_current_step(job_id, step_name)

        if not ConditionEvaluator.should_run(
            step_def.if_condition, step_results, context,
        ):
            skipped = StepResult(
                step_name=step_name,
                step_type=step_def.type,
                status=StepStatus.SKIPPED,
            )
            step_results.append(skipped)
            monitor.on_step_completed(job_id, skipped)
            continue

        step_cls = StepRegistry.get(step_def.type, script.definition.version)
        if step_cls is None:
            missing_step = StepResult(
                step_name=step_name,
                step_type=step_def.type,
                status=StepStatus.FAILED,
                error=f"No implementation found for step type '{step_def.type}'",
            )
            step_results.append(missing_step)
            return step_results, ScriptStatus.FAILED

        step_result = await run_step(step_cls, step_def, step_name, context)
        step_results.append(step_result)
        monitor.on_step_completed(job_id, step_result)

        store_step_outputs(step_def, step_result, context)

        if step_result.status == StepStatus.FAILED:
            return step_results, ScriptStatus.FAILED

    return step_results, script_status


async def execute_cleanup_steps(
    script: TestScript,
    context: StepContext,
    job_id: str,
    monitor: ExecutionMonitor,
) -> list[StepResult]:
    """Run cleanup steps unconditionally (even after failure)."""
    cleanup_results: list[StepResult] = []
    for step_idx, step_def in enumerate(script.definition.cleanup):
        cleanup_name = f"{script.name}[cleanup:{step_idx}]:{step_def.type}"
        monitor.on_step_started(job_id, step_idx, f"cleanup:{step_def.type}")

        step_cls = StepRegistry.get(step_def.type, script.definition.version)
        if step_cls:
            result = await run_step(step_cls, step_def, cleanup_name, context)
        else:
            result = StepResult(
                step_name=cleanup_name,
                step_type=step_def.type,
                phase=StepPhase.CLEANUP,
                status=StepStatus.FAILED,
                error=f"No implementation found for cleanup step '{step_def.type}'",
            )
        result.phase = StepPhase.CLEANUP
        cleanup_results.append(result)
        monitor.on_step_completed(job_id, result)

    return cleanup_results


async def run_script(
    script: TestScript,
    context: StepContext,
    job_id: str,
    monitor: ExecutionMonitor,
    jobs: JobManager,
) -> ScriptResult:
    """Execute all steps in a script sequentially (precondition → setup → main → cleanup)."""
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

    cleanup_results = await execute_cleanup_steps(
        script, context, job_id, monitor,
    )

    script_end = datetime.now(timezone.utc)
    all_step_results = precondition_results + setup_results + step_results + cleanup_results

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
