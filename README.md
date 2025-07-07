# Bun Coverage Report Action

[![GitHub Release](https://img.shields.io/github/v/release/70-10/bun-coverage-report-action)](https://github.com/70-10/bun-coverage-report-action/releases)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-Bun%20Coverage%20Report-blue.svg)](https://github.com/marketplace/actions/bun-coverage-report)
[![Test](https://github.com/70-10/bun-coverage-report-action/actions/workflows/test.yml/badge.svg)](https://github.com/70-10/bun-coverage-report-action/actions/workflows/test.yml)

🧪 **GitHub Action that generates coverage reports from Bun test LCOV output and posts them directly to your Pull Requests.**

Perfect for Bun projects that need automated coverage reporting with the same beautiful UI as vitest-coverage-report-action.

## 🚀 Quick Start

Add this workflow to your repository (`.github/workflows/coverage.yml`):

```yaml
name: Coverage Report

on:
  pull_request:
    branches: [main]

jobs:
  coverage:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.2.x"

      - name: Install dependencies
        run: bun install --frozen-lockfile

      - name: Run tests with coverage
        run: bun test --coverage --coverage-reporter=lcov --coverage-dir=coverage

      - name: Coverage Report
        uses: 70-10/bun-coverage-report-action@v1.0.3
        with:
          lcov-path: coverage/lcov.info
          min-coverage: 80
```

## 📖 Usage Examples

### Basic Coverage Report

```yaml
- name: Coverage Report
  uses: 70-10/bun-coverage-report-action@v1.0.3
```

### With Coverage Threshold

```yaml
- name: Coverage Report
  uses: 70-10/bun-coverage-report-action@v1.0.3
  with:
    min-coverage: 90
    lcov-path: coverage/lcov.info
```

### Multiple Coverage Reports

```yaml
- name: Unit Test Coverage
  uses: 70-10/bun-coverage-report-action@v1.0.3
  with:
    name: "Unit Tests"
    lcov-path: coverage/unit/lcov.info
    min-coverage: 85

- name: Integration Test Coverage
  uses: 70-10/bun-coverage-report-action@v1.0.3
  with:
    name: "Integration Tests"
    lcov-path: coverage/integration/lcov.info
    min-coverage: 70
```

## ⚙️ Configuration

| Input               | Description                                                       | Default               | Required |
| ------------------- | ----------------------------------------------------------------- | --------------------- | -------- |
| `lcov-path`         | Path to the LCOV coverage file                                    | `coverage/lcov.info`  | No       |
| `min-coverage`      | Minimum coverage threshold (%). Action fails if below this value  | `0`                   | No       |
| `github-token`      | GitHub token for posting PR comments                              | `${{ github.token }}` | No       |
| `working-directory` | Working directory to look for coverage files                      | `./`                  | No       |
| `name`              | Name for the coverage report (useful for multiple reports)        | `""`                  | No       |
| `pr-number`         | Pull request number to comment on (auto-detected if not provided) | `""`                  | No       |

## 🔧 Setup Your Bun Project

Configure your test script in `package.json`:

```json
{
  "scripts": {
    "test:coverage": "bun test --coverage --coverage-reporter=lcov --coverage-dir=coverage"
  }
}
```

## 🎯 Coverage Thresholds

Set `min-coverage` to enforce coverage requirements:

- **0-100**: Percentage of line coverage required
- **Action fails** if coverage is below threshold
- **Perfect for CI/CD** pipelines requiring quality gates

Example with strict requirements:

```yaml
with:
  min-coverage: 95 # Requires 95% line coverage
```

## 🤝 Compatibility

- ✅ **Bun** 1.0+
- ✅ **TypeScript** projects
- ✅ **JavaScript** projects
- ✅ **Monorepos** (with `working-directory`)
- ✅ **vitest-coverage-report-action** UI compatibility

## 📄 License

MIT © [70-10](https://github.com/70-10)

## 🙏 Acknowledgments

- Inspired by [vitest-coverage-report-action](https://github.com/davelosert/vitest-coverage-report-action)
- Built for the [Bun](https://bun.sh) ecosystem

---

**🚀 Ready to get started?** [Add this action to your workflow](#-quick-start) and start getting beautiful coverage reports on your Pull Requests!
