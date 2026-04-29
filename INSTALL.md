# Installation Guide for `tractusx-testlab`

This document will help you get started with installing and using the `tractusx-testlab` Python package.

## Prerequisites

- Python 3.12.0 or higher
- `pip` (Python package installer)

It's recommended to use a virtual environment to avoid conflicts with other packages:

```bash
python -m venv venv
source venv/bin/activate   # On Windows, use `venv\Scripts\activate`
```

## Installation

Install the package directly from PyPI (once published):

```bash
pip install tractusx-testlab
```

## Dependencies

This library depends on the [tractusx-sdk](https://github.com/eclipse-tractusx/tractusx-sdk). It will be installed automatically as a dependency.

## Upgrade to the Latest Version

To upgrade to the latest version of `tractusx-testlab`:

```bash
pip install --upgrade tractusx-testlab
```

## Documentation

For more information, refer to the official documentation or README.

## Troubleshooting

- Ensure Python version is compatible
- Use `--no-cache-dir` with pip if encountering caching issues:
  ```bash
  pip install --no-cache-dir tractusx-testlab
  ```

## NOTICE

This work is licensed under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/legalcode).

- SPDX-License-Identifier: CC-BY-4.0
- SPDX-FileCopyrightText: 2025 Contributors to the Eclipse Foundation
- Source URL: https://github.com/eclipse-tractusx/tractusx-testlab
