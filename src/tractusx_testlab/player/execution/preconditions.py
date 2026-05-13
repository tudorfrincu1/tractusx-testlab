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

"""Precondition phase execution — validates environment before test starts."""

from __future__ import annotations

from typing import Any

from tractusx_sdk.extensions.testlab.models import ScriptStatus, StepStatus
from tractusx_sdk.extensions.testlab.player.execution.context import StepContext
from tractusx_sdk.extensions.testlab.player.execution.monitor import ExecutionMonitor
from tractusx_sdk.extensions.testlab.player.jobs import JobManager
from tractusx_sdk.extensions.testlab.scripting.registry import StepRegistry
from tractusx_sdk.extensions.testlab.scripting.script import TestScript
from tractusx_sdk.extensions.testlab.steps.conditions import ConditionEvaluator
from tractusx_testlab.models.enums import StepPhase
from tractusx_testlab.models.preconditions import PreconditionLog
from tractusx_testlab.models.results import StepResult
from tractusx_testlab.player.execution.step_runner import run_step, store_step_outputs


async def execute_precondition_steps(
    script: TestScript,
    context: StepContext,
    job_id: str,
    monitor: ExecutionMonitor,
    jobs: JobManager,
) -> tuple[list[StepResult], ScriptStatus]:
    """Run precondition steps; stops on first failure.

    Precondition steps validate that the environment is ready for testing.
    Their outputs (list[PreconditionLog]) are copied into StepResult.precondition_logs.
    """
    if not script.definition.preconditions:
        return [], ScriptStatus.COMPLETED

    precondition_results: list[StepResult] = []
    precondition_status = ScriptStatus.COMPLETED

    for step_idx, step_def in enumerate(script.definition.preconditions):
        step_name = f"{script.name}[precondition:{step_idx}]:{step_def.type}"
        monitor.on_step_started(job_id, step_idx, f"precondition:{step_def.type}")
        jobs.set_current_step(job_id, step_name)

        if not ConditionEvaluator.should_run(
            step_def.if_condition, precondition_results, context,
        ):
            skipped = StepResult(
                step_name=step_name,
                step_type=step_def.type,
                phase=StepPhase.PRECONDITION,
                status=StepStatus.SKIPPED,
            )
            precondition_results.append(skipped)
            monitor.on_step_completed(job_id, skipped)
            continue

        step_cls = StepRegistry.get(step_def.type, script.definition.version)
        if step_cls is None:
            missing = StepResult(
                step_name=step_name,
                step_type=step_def.type,
                phase=StepPhase.PRECONDITION,
                status=StepStatus.FAILED,
                error=f"No implementation found for precondition step '{step_def.type}'",
            )
            precondition_results.append(missing)
            return precondition_results, ScriptStatus.FAILED

        step_result = await run_step(step_cls, step_def, step_name, context)
        step_result.phase = StepPhase.PRECONDITION

        precondition_logs = _extract_precondition_logs(step_result.output)
        if precondition_logs:
            step_result.precondition_logs = precondition_logs

        precondition_results.append(step_result)
        monitor.on_step_completed(job_id, step_result)

        store_step_outputs(step_def, step_result, context)

        if step_result.status == StepStatus.FAILED:
            return precondition_results, ScriptStatus.FAILED

    return precondition_results, precondition_status


def _extract_precondition_logs(output: Any) -> list[PreconditionLog]:
    """Extract PreconditionLog entries from step output value."""
    if not isinstance(output, list):
        return []
    return [log for log in output if isinstance(log, PreconditionLog)]
