---
name: document-knowledge
description: "Document domain knowledge in the agent's knowledge base. Use when you discover a notable pattern, gotcha, anti-pattern, lesson learned, or reusable solution during your work. Captures institutional memory so the team gets smarter over time. Keywords: knowledge, learn, document, pattern, gotcha, lesson, anti-pattern, memory, KB, knowledge base, insight, discovery."
---

# Document Knowledge

Use this skill when you discover something notable during your work — a pattern that worked well, a gotcha that wasted time, an anti-pattern to avoid, or a reusable solution to a recurring problem.

## What This Skill Produces

A concise, structured knowledge entry appended to your agent's knowledge base file in `.github/kb/`. The entry is immediately available to you in future sessions and to other agents as reference.

## When to Use

Document knowledge when you encounter:
- A **pattern** that proved effective and should be reused
- A **gotcha** or subtle bug that was hard to diagnose
- An **anti-pattern** that should never be repeated
- A **lesson learned** from a mistake or unexpected behavior
- A **solution** to a problem that is likely to recur
- A **convention** that was unclear and needed clarification
- An **API quirk** or library behavior that isn't obvious from docs

Do NOT document:
- Trivial facts already in project instructions
- One-time fixes unlikely to recur
- Information that belongs in code comments instead
- Opinions without evidence

## Knowledge Base Files

Each specialist agent owns a KB file:

| Agent | KB File |
|-------|---------|
| `testlab-ide-master` | `.github/kb/ide-kb.md` |
| `testlab-master` | `.github/kb/backend-kb.md` |
| `testlab-test-master` | `.github/kb/test-kb.md` |
| `testlab-docs-master` | `.github/kb/docs-kb.md` |
| `testlab-architect` | `.github/kb/architect-kb.md` |

## Entry Format

Every entry MUST follow this template:

```markdown
### {CATEGORY}-{N}: {Short Title}
- **Date**: YYYY-MM-DD
- **Context**: What you were doing when you discovered this
- **Insight**: The knowledge itself — what is true, what works, what doesn't
- **Evidence**: How you verified this (test output, error message, behavior observed)
- **Action**: What to do differently based on this knowledge
```

### Categories

| Prefix | Meaning | Example |
|--------|---------|---------|
| `PAT` | Pattern — a proven approach to reuse | PAT-3: Use `useCallback` for Blockly event handlers |
| `GOTCHA` | Gotcha — a subtle trap | GOTCHA-1: Blockly fires change events during undo |
| `ANTI` | Anti-pattern — something to avoid | ANTI-2: Don't mutate Zustand state directly |
| `LESSON` | Lesson learned — from a mistake | LESSON-1: Always test block deletion undo path |
| `FIX` | Reusable fix — a solution to a recurring problem | FIX-4: Clear workspace listeners before re-init |
| `API` | API quirk — non-obvious library behavior | API-1: Monaco `setValue()` resets cursor position |

### Numbering

Increment the number within each category. Check existing entries to find the next number.

## Workflow

1. **Recognize** — You've hit something notable during your work (a subtle bug, a pattern that clicks, a library quirk).
2. **Verify** — Confirm the insight is real (test it, reproduce it, or cite evidence).
3. **Read** your KB file to find the next available entry number.
4. **Append** the entry at the end of the appropriate section in your KB file.
5. **Continue** your original task — this is a quick detour, not a separate task.

## Quality Criteria

A good KB entry:
- Is **concise** — 3-5 lines maximum per field
- Is **actionable** — tells the reader what to do differently
- Is **evidence-based** — includes how you verified the insight
- Is **findable** — has a clear, searchable title
- Is **unique** — doesn't duplicate an existing entry

A bad KB entry:
- Restates project conventions already in instructions files
- Is vague ("React is tricky with state")
- Has no evidence or verification
- Is too long (treat KB like a reference card, not a blog post)

## Completion Criteria

The skill is complete when:
- The entry is appended to the correct KB file
- The entry follows the template format exactly
- The entry number doesn't conflict with existing entries
- The original task continues without interruption

## Example Prompts

- Document this pattern I just discovered about Blockly workspace events.
- I found a gotcha with the SDK — record it in the knowledge base.
- This async pattern worked well — add it to the KB for future reference.
- Record this anti-pattern so we never repeat it.

<!--
 Eclipse Tractus-X - Tractus-X TestLab

 Copyright (c) 2026 Contributors to the Eclipse Foundation

 Licensed under the Creative Commons Attribution 4.0 International License
 (the "License"); you may not use this file except in compliance with the
 License. You may obtain a copy of the License at

    https://creativecommons.org/licenses/by/4.0/

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.

 SPDX-License-Identifier: CC-BY-4.0
-->
