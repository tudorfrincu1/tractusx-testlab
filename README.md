# Eclipse Tractus-X Test Lab

**TestLab** is the testing framework built into the [Tractus-X SDK](https://github.com/eclipse-tractusx/tractusx-sdk). It enables you to author, compile, distribute, and execute automated test cases against dataspace connectors and industry services — without writing any Python code.

Test authors write **declarative YAML tests** describing the steps to execute, the services to connect to, the assertions to evaluate, and the cleanup to perform. TestLab takes care of the rest: validation, encryption, packaging, execution, and structured reporting.

## Key Components

- **Tests** — YAML-defined test sequences composed of reusable, predefined steps
- **Compiler** — Validates tests at compile time and packages them into portable, encrypted-by-default `.testpkg` artifacts
- **Player** — An async executor deployable as standalone CLI or embeddable in an existing application, with cryptographic identity for package authorization
- **Services** — Managed SDK service lifecycle for connector, provider, and DTR instances with automatic initialization and reuse across steps
- **Server** — FastAPI-based callback/webhook engine with dynamically mounted routes for async request/response patterns

## How It Works

Tests can declare long-lived services that persist for the test duration (avoiding repeated initialization), configure callback endpoints to receive async responses, and leverage runtime variable resolution. These tests are compiled with strict validation, packaged into distributable artifacts, and executed by the Player — which resolves runtime variables, manages step sequencing, evaluates assertions, orchestrates managed services, and provides live execution status.

Tests with steps like (e.g., `provision_asset`, `negotiate_contract`, `validate_aspect_model`) can be included inside of test cases, which enable reusability and personalized configurations for different scenarios.

## Getting Started

Please refer to the [INSTALL.md](INSTALL.md) for installation instructions.

## Documentation

Detailed documentation is available in the [docs](docs/) directory.

## Contributing

Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for information on how to contribute to this project.

## License

Distributed under the Apache License 2.0. See [LICENSE](LICENSE) for code and [LICENSE_non-code](LICENSE_non-code) for non-code content.

## NOTICE

This work is licensed under the [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0).

- SPDX-License-Identifier: Apache-2.0
- SPDX-FileCopyrightText: 2025 Contributors to the Eclipse Foundation
- Source URL: https://github.com/eclipse-tractusx/tractusx-testlab
