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
| `lcov-path`         | Path to the LCOV coverage file                                    | `coverage/lcov.info`  | ❌       |
| `min-coverage`      | Minimum coverage threshold (%). Action fails if below this value  | `0`                   | ❌       |
| `github-token`      | GitHub token for posting PR comments                              | `${{ github.token }}` | ❌       |
| `working-directory` | Working directory to look for coverage files                      | `./`                  | ❌       |
| `name`              | Name for the coverage report (useful for multiple reports)        | `""`                  | ❌       |
| `pr-number`         | Pull request number to comment on (auto-detected if not provided) | `""`                  | ❌       |

## 🔧 Setup Your Bun Project

1. **Install Bun** (if not already installed):

   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Configure your test script** in `package.json`:

   ```json
   {
     "scripts": {
       "test": "bun test",
       "test:coverage": "bun test --coverage --coverage-reporter=lcov --coverage-dir=coverage"
     }
   }
   ```

3. **Add test files** following Bun's conventions (`.test.ts`, `.spec.ts`):

   ```typescript
   // math.test.ts
   import { expect, test } from "bun:test";
   import { add } from "./math";

   test("adds 1 + 2 to equal 3", () => {
     expect(add(1, 2)).toBe(3);
   });
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

## 🛠️ Development

### Prerequisites

- [Bun](https://bun.sh) 1.0+
- Node.js 20+ (for GitHub Actions runtime)

### Local Development

```bash
# Clone the repository
git clone https://github.com/70-10/bun-coverage-report-action.git
cd bun-coverage-report-action

# Install dependencies
bun install

# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Build the action
bun run build
```

### Testing

This project follows **Test-Driven Development (TDD)**:

1. 🔴 **RED**: Write failing tests first
2. 🟢 **GREEN**: Implement minimal code to pass tests
3. 🔵 **REFACTOR**: Clean up and optimize code

Run tests:

```bash
bun test                    # Run all tests
bun test --watch           # Watch mode
bun test --coverage        # With coverage report
```

## 📄 License

MIT © [yoshida_nao](https://github.com/70-10)

## 🙏 Acknowledgments

- Inspired by [vitest-coverage-report-action](https://github.com/davelosert/vitest-coverage-report-action)
- Built for the [Bun](https://bun.sh) ecosystem

---

**🚀 Ready to get started?** [Add this action to your workflow](#-quick-start) and start getting beautiful coverage reports on your Pull Requests!
