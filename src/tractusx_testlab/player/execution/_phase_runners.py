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

"""Phase runners — execute setup, main, and teardown step sequences."""

from __future__ import annotations

from tractusx_testlab.models import ScriptStatus, StepStatus
from tractusx_testlab.models.enums import StepPhase
from tractusx_testlab.models.results import StepResult
from tractusx_testlab.player.execution.context import StepContext
from tractusx_testlab.player.execution.monitor import ExecutionMonitor
from tractusx_testlab.player.jobs import JobManager
from tractusx_testlab.scripting.registry import StepRegistry
from tractusx_testlab.scripting.script import TestScript
from tractusx_testlab.steps.conditions import ConditionEvaluator


async def execute_setup_steps(
    script: TestScript,
    context: StepContext,
    job_id: str,
    monitor: ExecutionMonitor,
    jobs: JobManager,
) -> tuple[list[StepResult], ScriptStatus]:
    """Run setup steps; stops on first failure."""
    from tractusx_testlab.player.execution.step_runner import run_step, store_step_outputs

    setup_results: list[StepResult] = []
    setup_status = ScriptStatus.COMPLETED

    for step_idx, step_def in enumerate(script.definition.setup):
        await jobs.get_pause_event(job_id).wait()
        step_name = f"{script.name}[setup:{step_idx}]:{step_def.type}"
        monitor.on_step_started(job_id, step_idx, step_def.type, step_name=step_name, phase="setup")
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
    from tractusx_testlab.player.execution.step_runner import run_step, store_step_outputs

    step_results: list[StepResult] = []
    script_status = ScriptStatus.COMPLETED

    for step_idx, step_def in enumerate(script.definition.steps):
        await jobs.get_pause_event(job_id).wait()
        step_name = f"{script.name}[{step_idx}]:{step_def.type}"
        monitor.on_step_started(job_id, step_idx, step_def.type, step_name=step_name, phase="main")
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


async def execute_teardown_steps(
    script: TestScript,
    context: StepContext,
    job_id: str,
    monitor: ExecutionMonitor,
) -> list[StepResult]:
    """Run teardown steps unconditionally (even after failure)."""
    from tractusx_testlab.player.execution.step_runner import run_step

    teardown_results: list[StepResult] = []
    for step_idx, step_def in enumerate(script.definition.teardown):
        teardown_name = f"{script.name}[teardown:{step_idx}]:{step_def.type}"
        monitor.on_step_started(job_id, step_idx, step_def.type, step_name=teardown_name, phase="cleanup")

        step_cls = StepRegistry.get(step_def.type, script.definition.version)
        if step_cls:
            result = await run_step(step_cls, step_def, teardown_name, context)
        else:
            result = StepResult(
                step_name=teardown_name,
                step_type=step_def.type,
                phase=StepPhase.CLEANUP,
                status=StepStatus.FAILED,
                error=f"No implementation found for teardown step '{step_def.type}'",
            )
        result.phase = StepPhase.CLEANUP
        teardown_results.append(result)
        monitor.on_step_completed(job_id, result)

    return teardown_results
