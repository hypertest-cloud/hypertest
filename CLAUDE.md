# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies
npm i

# Build all packages (from root)
npm run build

# Build specific package
npm run build --workspace=packages/hypertest-core

# Lint all packages
npm run lint

# Lint specific package
npm run lint --workspace=packages/hypertest-core

# Build Docker image for Playwright tests
npm run docker

# Run all tests
npm test

# Run tests for a specific package
npm test --workspace=packages/hypertest-core
```

### CLI Commands (run from playground or user project)
```bash
npx hypertest init                # Create hypertest.config.js interactively
npx hypertest deploy              # Deploy tests to cloud (builds + pushes image to ECR + updates Lambda)
npx hypertest invoke              # Run tests in cloud
npx hypertest invoke --dry-run    # Simulate invoke without Lambda calls
npx hypertest invoke --quiet      # Plain text output — no Ink UI (use in CI/non-TTY)
npx hypertest doctor              # Validate configuration and cloud provider setup
```

## Project Architecture

Hypertest is a cloud-based test distribution system that runs each test file in a separate Lambda function for maximum parallelization. Built as a TypeScript monorepo.

### Package Structure
- **hypertest-core**: CLI entry point (`hypertest` binary) and orchestration logic
- **hypertest-types**: Shared TypeScript interfaces (`TestRunnerPluginDefinition`, `CloudProviderPluginDefinition`)
- **hypertest-plugin-playwright**: Playwright test framework integration
- **hypertest-runner-aws-playwright**: Lambda handler code that executes Playwright tests
- **hypertest-provider-cloud-aws**: AWS cloud provider (ECR, Lambda, S3)
- **hypertest-playground**: Example implementation for testing
- **hypertest-docs**: VitePress documentation site
- **internal-hypertest-playwright-container**: Container utilities for Playwright in Lambda

Note: `hypertest-types` must build first (see workspace ordering in root `package.json`).

### Plugin System
Two plugin interfaces in `hypertest-types`:

**TestRunnerPlugin** (`test-runner-plugin.ts`):
- `getInvokePayloadContext()`: Returns invoke payload context (one per test file)
- `getTestDir()`: Returns path to test directory (used for drift detection hashing)
- `buildImage()`: Builds Docker image with tests

**CloudProviderPlugin** (`cloud-provider.ts`):
- `pullBaseImage()`: Pull pre-built base image
- `pushImage()`: Push built image to registry
- `invoke(payload)`: Invoke cloud function
- `updateManifest(contexts, testDirHash)`: Store invoke payload contexts + test dir hash to cloud (called during deploy)
- `pullManifest()`: Fetch manifest from cloud (called during invoke)
- `updateLambdaImage()`: Update Lambda with new image
- `uploadRunResult(runId, content)`: Upload serialized results file to cloud storage at `{runId}/{resultsFileName}` (default: `hypertest.results.json`)

### Execution Flow

**Deploy** (`packages/hypertest-core/src/index.ts`):
1. Pull base image from ECR
2. Build target image (base + user tests)
3. Push to ECR
4. Build manifest (store invoke payload contexts + test dir hash to cloud via `updateManifest`)
5. Update Lambda function

**Invoke** (`packages/hypertest-core/src/index.ts`):
1. Generate unique `runId`
2. Pull manifest from cloud (`pullManifest`) — contains pre-built invoke payload contexts and `testDirHash`
3. Hash local test dir; compare with manifest hash (drift detection via `driftDetectionPolicy`)
4. Invoke Lambdas concurrently (up to `concurrency` limit) using manifest payloads
5. Write results file locally (CWD) and upload to cloud storage at `{runId}/{resultsFileName}` (default: `hypertest.results.json`)

### Key Files
- CLI entry: `packages/hypertest-core/src/cli.tsx`
- Core orchestration: `packages/hypertest-core/src/index.ts`
- Events system: `packages/hypertest-core/src/events.ts`
- Type definitions: `packages/hypertest-types/src/index.ts`
- Run result types: `packages/hypertest-types/src/run-result.ts` (`HypertestRunResult`, `HypertestTestResult`)
- Event types: `packages/hypertest-types/src/events.ts` (`HypertestEvents`, `HypertestEvent`, `DeployStep`)
- Lambda handler: `packages/hypertest-runner-aws-playwright/src/index.ts`
- Playwright report parser: `packages/hypertest-runner-aws-playwright/src/utils/parsePlaywrightReport.ts`

### Platform Compatibility (Windows)
- Test scripts use quoted glob patterns (`"src/__tests__/**/*.test.ts"`) so Node 22 expands them — never bash `$(find ...)` syntax
- `spawn()` calls in `runCommand.ts` use `{ shell: true }` instead of `spawn('sh', ['-c', cmd])` so they work on both Unix and Windows
- `deployStarted` flag in `cli.tsx` prevents calling `reporter.abort()` after Ink has already mounted — only abort when `setupHypertest()` itself throws (before any events are emitted)

### Configuration
Projects use `hypertest.config.js`:
```javascript
import { defineConfig } from '@hypertest-cloud/hypertest-core';
import playwright from '@hypertest-cloud/hypertest-plugin-playwright';
import aws from '@hypertest-cloud/hypertest-provider-cloud-aws';

export default defineConfig({
  concurrency: 30,
  imageName: 'your-app/hypertest-playwright',
  testRunner: playwright({}),
  cloudProvider: aws({
    baseImage: 'account.dkr.ecr.region.amazonaws.com/hypertest/base-playwright:latest',
    region: 'eu-central-1',
    ecrRegistry: 'account.dkr.ecr.region.amazonaws.com',
    functionName: 'your-function-name',
    bucketName: 'your-artifacts-bucket',
  }),
});
```

### Events System
Core emits typed events via `HypertestEvents` (`packages/hypertest-types/src/events.ts`).
Pass custom `events` to `setupHypertest()` to hook into: `run:start`, `run:end`, `test:start`, `test:end`, `deploy:step`, `doctor:check`, `doctor:done`.
`packages/hypertest-core/src/cli.tsx` consumes these events for terminal output via a reporter selected at runtime: Ink (rich TUI) when stdout is a TTY and `--quiet` is not passed; plain text otherwise. Both implement the `Reporter` interface (`packages/hypertest-core/src/ui/reporters/`).

### Two-Stream Output Architecture
hypertest has two separate output streams that must not be mixed:
- **Event bus** (`HypertestEvents`): lifecycle signals driving the terminal UI (Ink or plain reporter)
- **Logger** (`config.logger`, Winston): operational/debug messages routed to stderr

When Ink is active (`silent=true` in `setupHypertest`), `config.logger.silent` is set to `true` automatically — this prevents Winston stderr writes from corrupting Ink's cursor-position tracking. The logger is fully functional in non-TTY and `--quiet` modes. See `packages/hypertest-core/src/index.ts` and `packages/hypertest-core/src/logger.ts`.

### Drift Detection
On invoke, hypertest hashes local test dir and compares with deployed manifest hash.
Control behavior via `driftDetectionPolicy` config option:
- `'warning'` (default): emit log warning and continue
- `'error'`: throw and abort
- `'silence'`: ignore

### Artifact Handling
Tests use `HT_TEST_ARTIFACTS_OUTPUT_PATH` environment variable for cloud artifact storage:
```javascript
await page.screenshot({
  path: `${process.env.HT_TEST_ARTIFACTS_OUTPUT_PATH}/screenshots/test.png`,
});
```

### Dev / Demo Mode
Set `HYPERTEST_DEV=true` to run the CLI with mocked data — no AWS credentials needed.
Useful for developing the Ink UI without a real cloud deployment.

```bash
HYPERTEST_DEV=true npx hypertest invoke   # Simulated run with 14 mock tests
HYPERTEST_DEV=true npx hypertest deploy   # Simulated deploy steps
HYPERTEST_DEV_SPEED=5                     # Speed multiplier (default 10×); lower = slower animation
```

## Testing

```bash
npm test --workspace=packages/hypertest-core   # ~90 unit tests
```

Uses Node's built-in test runner with `tsx/esm` for TypeScript + JSX and `ink-testing-library` for Ink component tests.

```
src/__tests__/
├── apps/              # InvokeApp, DeployApp, DoctorApp
├── components/        # TestRow, InvokeSummary, DoctorCheck, StepList, …
├── reporters/         # plainReporter, pickReporter
├── events.test.ts
├── init.test.ts
├── parseTestResult.test.ts
└── theme.test.ts
```

## Code Quality

- **Biome**: Linting and formatting (`biome.json` - all rules enabled except a11y)
- **TypeScript**: Strict mode, ES2016 target, NodeNext module resolution
- **npm workspaces**: Monorepo management

## CI/CD Workflows

Two-workflow pattern with `repository_dispatch` for sequential triggering:

1. **runner-aws-playwright-base-image-dev.yml**: Builds base image on runner package changes, triggers playground workflow
2. **playground-image-dev.yml**: Builds and deploys playground on changes or when triggered by runner workflow

## AWS Requirements

- ECR repository for container images
- Lambda function (container image type)
- S3 bucket for test artifacts
- IAM permissions for ECR, Lambda, S3, ServiceQuotas

If you encounter `TooManyRequestsException: Rate Exceeded`, request Lambda concurrency quota increase via AWS Service Quotas console.
