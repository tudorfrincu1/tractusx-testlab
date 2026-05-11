---
name: coordinate-ai-agents
description: "Coordinate multiple AI agents in parallel to execute a task. Use when you need to plan work packages, split independent work, delegate to the best subagent for each slice, review outputs, resolve integration risks, organize team check-ins, brainstorm with the human in plan mode, or deliver a consolidated result. Keywords: orchestrate, delegate, parallelize, subagents, review, work packages, chief agent, multi-agent, team meeting, plan mode."
---

# Coordinate AI Agents

Use this skill when a task is too large, cross-cutting, or specialized for one agent to handle well.

## What This Skill Produces

A short, executable coordination plan that:
- identifies the right specialist agents
- splits the work into independent packages where possible
- runs independent packages in parallel
- keeps dependent packages serialized
- reviews each delivery before integrating it
- returns a consolidated final result

## Inputs

Collect these before delegating:
- the user's goal
- the relevant code areas or files
- dependencies between work items
- verification commands or acceptance criteria
- any constraints on scope, style, or files to avoid

## Workflow

1. Read the most relevant local code or instructions first.
2. State one concrete hypothesis about how the task should work.
3. Break the work into atomic packages with a single owner each.
4. Choose the best subagent for each package based on expertise.
5. Run independent packages in parallel.
6. Serialize any package that depends on another package's output.
7. Review each result against the requested behavior and repo conventions.
8. Fix integration issues before reporting completion.
9. Validate with the cheapest meaningful executable check available.

## Team Coordination

Use a team meeting when the task benefits from shared context, alignment, or checkpointing across multiple agents.

In a team meeting:
- summarize the goal, current state, and open risks
- share each agent's progress in a concise format
- confirm dependencies and next owners before continuing
- surface disagreements early instead of letting them compound
- end with a clear next-action list and decision owner

## Meeting Minutes

After every team meeting, the AI master or the architect must produce meeting minutes.

The meeting minutes should:
- capture the decisions made
- record open questions and risks
- list the next actions and owners
- be delivered to the human after the meeting
- stay short, factual, and action-oriented

## Plan Mode Brainstorming

When the human wants plan mode, treat it as a collaborative design session rather than an execution session.

In plan mode:
- explore options with the human before locking in execution
- compare trade-offs and call out uncertainty explicitly
- keep the discussion focused on scope, sequence, and risk
- turn the agreed direction into work packages only after alignment
- avoid implementation details until the plan is settled

## Delegation Rules

Assign work based on the strongest fit:
- planning, scope, and trade-offs: architect agent
- frontend and UI work: IDE specialist
- backend and Python work: backend specialist
- tests and fixtures: test specialist
- docs and tutorials: docs specialist

When splitting work:
- keep each package small enough for one agent session
- avoid overlapping file ownership
- prefer one clear deliverable per agent
- make acceptance criteria concrete and testable

## Review Checklist

Review every delivery for:
- correctness against the original request
- adherence to existing patterns
- missing edge cases
- unnecessary abstractions
- test coverage or validation gaps
- file size and module boundary violations

## Completion Criteria

The task is complete only when:
- all required packages are done
- dependent results have been integrated
- validation has been run
- the final answer clearly states what changed and what was verified

## Example Prompts

- Coordinate the frontend, backend, and test changes needed for this feature.
- Split this bugfix into parallel work packages and assign the best subagents.
- Review the output from each subagent and consolidate the final changes.
- Use the right specialist agents to implement this task with minimal overlap.
