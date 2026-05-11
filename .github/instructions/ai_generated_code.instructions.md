---
applyTo: "**/*"
---

# AI-Generated Code License Subtitle

When generating or modifying source code files, you **MUST** include a two-line subtitle immediately after the license header block, using the appropriate comment syntax for the file's language.

The subtitle text (without comment markers) is:

```
This code was partially generated using artificial intelligence (AI) (Tool: <TOOL_NAME>, Model: <MODEL_NAME>). 
It was reviewed and tested by a human committer.
```

- **`<TOOL_NAME>`**: Replace with the name of the tool you are running as (e.g., `Copilot`).
- **`<MODEL_NAME>`**: Replace with the name of the model you are currently using (e.g., `Claude Opus 4.6`, `GPT-4o`). You know your own model name — use it.

## Language Examples

**Python / Shell / YAML** (use `##`):
```python
## This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). 
## It was reviewed and tested by a human committer.
```

**Java / C / C++ / JavaScript / TypeScript / Go / Rust** (use `//`):
```java
// This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). 
// This code was reviewed and tested by a human committer.
```

**HTML / XML** (use `<!-- -->`):
```html
<!-- This code was partially generated using artificial intelligence (AI) (Tool: Copilot, Model: Claude Opus 4.6). -->
<!-- It was reviewed and tested by a human committer. -->
```

## Rules

- **New files**: Always add this subtitle right after the license header.
- **Modified files**: If the subtitle is not already present, add it right after the license header. If it is already present, leave it as-is.
- **Placement**: The subtitle must appear on the lines immediately following the license header's closing delimiter, before any code, imports, or module docstrings.
- **Comment syntax**: Use the appropriate comment style for the file's language.
- **Do not modify** the subtitle text content — only adapt the comment markers to match the language.
