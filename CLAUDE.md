# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building the Project
```bash
# Build all packages in workspace (from root)
npm run build

# Build specific package (run from package directory or use workspace flag)
npm run build --workspace=packages/hypertest-core
```

### Linting
```bash
# Lint all packages (from root)
npm run lint

# Lint specific package (run from package directory or use workspace flag)
npm run lint --workspace=packages/hypertest-core
```

### Hypertest User Commands (from playground)
```bash
# Install dependencies first
npm i

# Build all packages
npm run build -w packages

# Deploy tests to cloud (main user command)
npx hypertest deploy

# Run tests in cloud (main user command)
npx hypertest invoke

# Deploy from playground (runs hypertest deploy)
npm run start:core -w packages/hypertest-playground
```

### Docker Commands
```bash
# Build and tag Docker image for Playwright tests
npm run docker
```

## Project Architecture

Hypertest is a cloud-based test distribution system built as a TypeScript monorepo with the following core architecture:

### Package Structure
- **hypertest-core**: Main library that orchestrates test execution and cloud deployment (CLI entry point with `hypertest` binary)
- **hypertest-types**: Shared TypeScript interfaces and type definitions across all packages
- **hypertest-plugin-playwright**: Plugin for Playwright test framework integration
- **hypertest-runner-aws-playwright**: AWS Lambda-specific runner for Playwright tests (actual runner code that executes in Lambda)
- **hypertest-provider-cloud-aws**: AWS cloud provider implementation for Lambda deployment and invocation
- **hypertest-playground**: Example implementation and testing environment showing real user workflow
- **hypertest-docs**: VitePress documentation site with comprehensive user guides
- **hypertest-playwright-container**: Container-specific code for Playwright in Lambda environment

### Core Components

#### Plugin-Based Architecture
The system uses a plugin-based architecture with two main plugin types:
- **TestRunnerPlugin**: Handles test framework integration (currently Playwright, more frameworks coming)
- **CloudFunctionProviderPlugin**: Manages cloud infrastructure (currently AWS Lambda, more providers coming)

Both plugins are exchangeable and can be replaced with different implementations.

#### Configuration System
Projects use `hypertest.config.js` with the `defineConfig` helper:
```javascript
export default defineConfig({
  concurrency: 30, // Max parallel cloud functions
  imageName: 'your-app/hypertest-playwright', // Docker image name
  localImageName: 'your-app/hypertest-playwright-local',
  localBaseImageName: 'your-app/hypertest-base-playwright',
  testRunner: playwright({}),
  cloudFunctionProvider: aws({
    baseImage: 'account.dkr.ecr.region.amazonaws.com/hypertest/base-playwright:latest',
    region: 'eu-central-1',
    ecrRegistry: 'account.dkr.ecr.region.amazonaws.com',
    functionName: 'your-app-hypertest-playwright',
    bucketName: 'your-app-hypertest-artifacts',
  }),
});
```

#### Playwright Configuration (Playground)
The playground package uses specific Playwright settings optimized for cloud execution:
- **forbidOnly: true** - Prevents `test.only()` calls in CI/CD environments
- **workers: 5** - Runs 5 parallel local workers for test execution
- **fullyParallel: false** - Tests run sequentially within each file
- **outputDir: 'test-artifacts/output'** - Local artifact output location
- **video: 'off'** - Video recording disabled for performance (artifacts handled via HT_TEST_ARTIFACTS_OUTPUT_PATH in cloud)

#### Two-Phase Execution Flow
1. **Deploy Phase** (`hypertest deploy`):
   - Pulls base image (pre-prepared container with Playwright + dependencies)
   - Builds target image (base image + user's tests)
   - Pushes image to ECR (AWS Container Registry)
   - Updates Lambda function with new image

2. **Invoke Phase** (`hypertest invoke`):
   - Generates unique run ID for the test execution
   - Test runner prepares function invoke payloads (one per test file)
   - Invokes cloud functions concurrently (up to concurrency limit)
   - Each Lambda function runs a single test file
   - Collects results and artifacts from S3 bucket

### Key Files and Locations
- User configuration: `hypertest.config.js` in project root
- CLI entry point: `packages/hypertest-core/src/cli.ts`
- Core orchestration: `packages/hypertest-core/src/index.ts`
- Type definitions: `packages/hypertest-types/src/index.ts`
- AWS Lambda handler: `packages/hypertest-runner-aws-playwright/src/index.ts`
- Lambda runner binary: `packages/hypertest-runner-aws-playwright/src/bin.ts`

## User Workflow (Real Usage Patterns)

### Installation Pattern
Users install three main packages:
```bash
npm install @hypertest/hypertest-core @hypertest/hypertest-plugin-playwright @hypertest/hypertest-provider-cloud-aws
```

### Configuration Pattern
Users create `hypertest.config.js` importing from installed packages:
```javascript
import { defineConfig } from '@hypertest/hypertest-core';
import playwright from '@hypertest/hypertest-plugin-playwright';
import aws from '@hypertest/hypertest-provider-cloud-aws';
```

### Development Cycle
1. Write/modify Playwright tests locally
2. Test locally: `npx playwright test`
3. Deploy to cloud: `npx hypertest deploy`
4. Run in cloud: `npx hypertest invoke`
5. Iterate

### Artifact Handling
Tests save artifacts using `HT_TEST_ARTIFACTS_OUTPUT_PATH` environment variable:
```javascript
await page.screenshot({
  path: `${process.env.HT_TEST_ARTIFACTS_OUTPUT_PATH}/screenshots/test.png`,
});
```

## CI/CD Integration

### GitHub Actions Workflows
The project uses two-workflow pattern:

1. **Runner Workflow** (`runner-aws-playwright-base-image-dev.yml`):
   - Triggers on changes to `packages/hypertest-runner-aws-playwright/**`
   - Builds and pushes base image to ECR
   - Uses `repository_dispatch` event (via `peter-evans/repository-dispatch` action) to trigger playground workflow
   - Passes `sha` and `ref` via `client_payload`

2. **Playground Workflow** (`playground-image-dev.yml`):
   - Triggers on changes to `packages/hypertest-playground/**`
   - Can be triggered by runner workflow via `repository_dispatch` event with type `base-image-built`
   - Receives commit info from `github.event.client_payload.sha` and `github.event.client_payload.ref`
   - Builds and deploys playground using hypertest commands

### Workflow Patterns
- Path-based triggering for efficiency
- Sequential execution via repository_dispatch (runner → playground)
- Proper commit SHA handling via client_payload for cross-workflow consistency
- Event-driven workflow communication using repository_dispatch

## Documentation Architecture

### VitePress Documentation Site (`packages/hypertest-docs`)
Comprehensive user documentation with clear progression:

1. **Introduction** (`docs/introduction.md`): Value proposition, problem solving, architecture overview
2. **Getting Started Series**:
   - **Installation** (`docs/getting-started/installation.md`): Package installation only
   - **Configuration** (`docs/getting-started/configuration.md`): Config file setup, AWS credentials, permissions
   - **Usage** (`docs/getting-started/usage.md`): Deploy/invoke workflow, development cycle, CI/CD integration
3. **Advanced Topics**: Plugins, Clouds, Architecture (some placeholder content)

### Documentation Style
- Progressive complexity (simple → advanced)
- Real code examples from playground package
- Comprehensive AWS setup guides with specific IAM permissions
- Cost optimization and troubleshooting sections

## Development Tools

### Code Quality
- **Biome**: Used for linting and formatting (configured in `biome.json`)
- **TypeScript**: Strict mode enabled with ES2016 target, NodeNext module resolution
- **Workspaces**: npm workspaces for monorepo management

### AWS Integration Requirements
- **IAM Permissions**: Specific policies for ECR, Lambda, S3, ServiceQuotas
- **Resources**: ECR repository, Lambda function, S3 bucket for artifacts
- **Regions**: Configurable AWS region (e.g., `eu-central-1`)
- **Concurrency Handling**: Built-in handling of Lambda concurrency limits with guidance for AWS Service Quotas

### Test Artifacts System
- Automatic S3 storage under `runId` directories
- Environment variable `HT_TEST_ARTIFACTS_OUTPUT_PATH` for test code
- Support for screenshots, videos, HAR files, JSON reports
- Structured artifact organization in S3 buckets

## Common Development Tasks

### Adding New Test Framework Support
1. Create new plugin package following `hypertest-plugin-playwright` pattern
2. Implement `TestRunnerPluginDefinition` interface
3. Create corresponding runner package for Lambda execution
4. Update core types and documentation

### Adding New Cloud Provider
1. Create new provider package following `hypertest-provider-cloud-aws` pattern
2. Implement `CloudFunctionProviderPluginDefinition` interface
3. Handle provider-specific deployment and invocation logic
4. Update configuration schema and documentation

### Debugging Cloud Function Issues
1. Check Lambda function logs in AWS CloudWatch
2. Verify ECR image deployment and tagging
3. Check S3 bucket permissions and artifact storage
4. Monitor AWS service quotas and concurrency limits
