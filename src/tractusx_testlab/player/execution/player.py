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

"""TestlabPlayer — async executor that runs TCKs script-by-script, step-by-step."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from tractusx_sdk.extensions.testlab.config.loader import ConfigLoader
from tractusx_sdk.extensions.testlab.config.settings import TestlabConfig
from tractusx_sdk.extensions.testlab.logging.structured import StructuredLogger
from tractusx_sdk.extensions.testlab.models import (
    AssertionSummary,
    JobStatus,
    ScriptResult,
    ScriptStatus,
    StepResult,
    TestCaseResult as TckResult,  # SDK alias
)
from tractusx_sdk.extensions.testlab.player.execution.context import StepContext
from tractusx_sdk.extensions.testlab.player.execution.monitor import ExecutionMonitor
from tractusx_testlab.player.execution.step_runner import (
    execute_cleanup_steps,
    execute_main_steps,
    execute_setup_steps,
    run_script,
)
from tractusx_testlab.player.jobs import JobManager
from tractusx_sdk.extensions.testlab.player.loading.loader import Loader
from tractusx_sdk.extensions.testlab.player.loading.ordering import topological_sort
from tractusx_sdk.extensions.testlab.scripting.script import TestCase as Tck, TestScript
from tractusx_sdk.extensions.testlab.services.manager import ServiceManager

# Ensure built-in steps are registered
import tractusx_sdk.extensions.testlab.steps  # noqa: F401


class TestlabPlayer:
    """High-level API for executing test cases.

    Usage::

        player = TestlabPlayer()
        result = await player.run("my_tck.yaml")
    """

    __slots__ = ("_config", "_logger", "_monitor", "_jobs", "_loader")

    def __init__(self, config: Optional[TestlabConfig] = None) -> None:
        self._config = config or ConfigLoader.load()
        self._logger = StructuredLogger("testlab.player", logs_dir=self._config.logs_dir)
        self._monitor = ExecutionMonitor(self._logger)
        self._jobs = JobManager()
        self._loader = Loader()

    @property
    def jobs(self) -> JobManager:
        return self._jobs

    @property
    def monitor(self) -> ExecutionMonitor:
        return self._monitor

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    async def run(self, path: str | Path, runtime_vars: Optional[dict] = None) -> TckResult:
        """Load and execute a TCK, returning the full result."""
        tck = self._loader.load(Path(path))
        return await self.run_tck(tck, runtime_vars=runtime_vars)

    async def run_tck(
        self,
        tck: Tck,
        runtime_vars: Optional[dict] = None,
    ) -> TckResult:
        """Execute a loaded Tck object."""
        job = self._jobs.create(tck.name)
        if runtime_vars:
            job.runtime_vars = runtime_vars

        self._jobs.start(job.job_id)

        job_logger = self._logger.for_job(job.job_id)
        monitor = self._create_job_monitor(job_logger)
        monitor.on_job_started(job.job_id, tck.name)

        svc_mgr = ServiceManager()
        context = StepContext(services=svc_mgr, job=job, config=self._config)

        self._seed_context_variables(context, tck, runtime_vars)

        tck_started_at = datetime.now(timezone.utc)
        ordered_scripts = topological_sort(tck.scripts)
        script_results = await self._execute_scripts_in_order(
            ordered_scripts, context, job, monitor,
        )
        tck_finished_at = datetime.now(timezone.utc)

        svc_mgr.teardown()

        result = self._build_tck_result(
            tck.name, script_results, tck_started_at, tck_finished_at,
        )
        self._finalize_job(job, result, monitor, job_logger)
        return result

    # ------------------------------------------------------------------
    # TCK helpers
    # ------------------------------------------------------------------

    def _create_job_monitor(self, job_logger: StructuredLogger) -> ExecutionMonitor:
        """Create a monitor for a job, propagating player-level callbacks."""
        monitor = ExecutionMonitor(job_logger)
        for callback in self._monitor._callbacks:
            monitor.add_callback(callback)
        return monitor

    @staticmethod
    def _seed_context_variables(
        context: StepContext,
        tck: Tck,
        runtime_vars: Optional[dict],
    ) -> None:
        """Seed context with shared variables (medium priority) and runtime vars (highest)."""
        if tck.definition.shared_variables:
            for var_name, var_def in tck.definition.shared_variables.items():
                if var_def.default is not None:
                    context.set_variable(var_name, var_def.default)

        if runtime_vars:
            for key, value in runtime_vars.items():
                context.set_variable(key, value)

    async def _execute_scripts_in_order(
        self,
        ordered_scripts: list[TestScript],
        context: StepContext,
        job: Any,
        monitor: ExecutionMonitor,
    ) -> list[ScriptResult]:
        """Execute scripts respecting dependency order, skipping on unmet deps."""
        script_results: list[ScriptResult] = []
        completed_tests: set[str] = set()

        for idx, script in enumerate(ordered_scripts):
            unmet_deps = [dep for dep in script.depends_on if dep not in completed_tests]

            if unmet_deps:
                skipped_result = self._make_skipped_result(script, unmet_deps)
                script_results.append(skipped_result)
                monitor.on_script_started(job.job_id, script.name, idx)
                monitor.on_script_completed(job.job_id, skipped_result)
                continue

            monitor.on_script_started(job.job_id, script.name, idx)
            job.current_script = script.name

            script_result = await run_script(script, context, job.job_id, monitor, self._jobs)
            script_results.append(script_result)
            monitor.on_script_completed(job.job_id, script_result)

            if script_result.status == ScriptStatus.COMPLETED:
                completed_tests.add(script.name)
                self._propagate_script_outputs(script, context)

        return script_results

    @staticmethod
    def _make_skipped_result(script: TestScript, unmet_deps: list[str]) -> ScriptResult:
        """Build a FAILED result for a script whose dependencies were not met."""
        now = datetime.now(timezone.utc)
        return ScriptResult(
            script_name=script.name,
            dataspace_version=script.definition.dataspace_version,
            status=ScriptStatus.FAILED,
            steps=[],
            started_at=now,
            finished_at=now,
            total_duration_s=0.0,
            assertion_summary=AssertionSummary(total=0, passed=0, failed_hard=0, failed_soft=0),
            error=f"Skipped — unmet dependencies: {', '.join(unmet_deps)}",
        )

    @staticmethod
    def _propagate_script_outputs(script: TestScript, context: StepContext) -> None:
        """Promote script output variables to the shared namespace for downstream tests."""
        for export_name, var_ref in script.definition.outputs.items():
            value = context.get_variable(var_ref)
            if value is not None:
                context.set_variable(export_name, value)
                context.set_variable(f"!{script.name}:{export_name}", value)

    @staticmethod
    def _build_tck_result(
        tck_name: str,
        script_results: list[ScriptResult],
        started_at: datetime,
        finished_at: datetime,
    ) -> TckResult:
        """Aggregate script results into a single TckResult."""
        all_passed = all(script.status == ScriptStatus.COMPLETED for script in script_results)
        return TckResult(
            tck_id=tck_name,
            status=ScriptStatus.COMPLETED if all_passed else ScriptStatus.FAILED,
            scripts=script_results,
            started_at=started_at,
            finished_at=finished_at,
        )

    def _finalize_job(
        self,
        job: Any,
        result: TckResult,
        monitor: ExecutionMonitor,
        job_logger: StructuredLogger,
    ) -> None:
        """Update job status and close the logger after execution completes."""
        job.result = result
        if result.passed:
            self._jobs.complete(job.job_id)
            monitor.on_job_completed(job.job_id, JobStatus.COMPLETED)
        else:
            self._jobs.fail(job.job_id, "One or more scripts failed")
            monitor.on_job_completed(job.job_id, JobStatus.FAILED)
        job_logger.close()


