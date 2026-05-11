<!--

Eclipse Tractus-X - Software Development KIT

Copyright (c) 2026 Catena-X Automotive Network e.V.
Copyright (c) 2026 Contributors to the Eclipse Foundation

See the NOTICE file(s) distributed with this work for additional
information regarding copyright ownership.

This work is made available under the terms of the
Creative Commons Attribution 4.0 International (CC-BY-4.0) license,
which is available at
https://creativecommons.org/licenses/by/4.0/legalcode.

SPDX-License-Identifier: CC-BY-4.0

-->

# YAML Script Format

!!! info "This page has moved"
    The YAML syntax reference has been reorganized into focused pages for easier navigation.
    Please visit the **[YAML Syntax Reference](syntax/index.md)**.

| Page | Description |
|------|-------------|
| [Tests](syntax/tests.md) | Structure of `kind: test` documents — variables, steps, assertions, cleanup |
| [Test Cases](syntax/test-cases.md) | `kind: test-case` manifests — shared variables, `"!include"` directives, library imports |
| [Dependencies & Outputs](syntax/dependencies-and-outputs.md) | `depends_on`, `${!...}` references, `import` field, file-based dependencies |
| [Services](syntax/services.md) | Managed services block, step binding, type validation, `init_service` / `stop_service` |
| [Assertions](syntax/assertions.md) | Value formats, dot-path assertions, severity levels |
| [Advanced Steps](syntax/advanced-steps.md) | `sdk_call` invocation, async callbacks and webhook endpoints |

---

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025, 2026 Contributors to the Eclipse Foundation
- SPDX-FileCopyrightText: 2025, 2026 Catena-X Automotive Network e.V.
- Source URL: [https://github.com/eclipse-tractusx/tractusx-sdk](https://github.com/eclipse-tractusx/tractusx-sdk)
