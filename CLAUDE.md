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
```

### CLI Commands (run from playground or user project)
```bash
npx hypertest deploy              # Deploy tests to cloud (builds + pushes image to ECR + updates Lambda)
npx hypertest invoke              # Run tests in cloud
npx hypertest invoke --grep <pattern>  # Run specific tests matching pattern
npx hypertest doctor              # Validate configuration and cloud provider setup
```

## Project Architecture

Hypertest is a cloud-based test distribution system that runs each test file in a separate Lambda function for maximum parallelization. Built as a TypeScript monorepo.

### Package Structure
- **hypertest-core**: CLI entry point (`hypertest` binary) and orchestration logic
- **hypertest-types**: Shared TypeScript interfaces (`TestRunnerPluginDefinition`, `CloudFunctionProviderPluginDefinition`)
- **hypertest-plugin-playwright**: Playwright test framework integration
- **hypertest-runner-aws-playwright**: Lambda handler code that executes Playwright tests
- **hypertest-provider-cloud-aws**: AWS cloud provider (ECR, Lambda, S3)
- **hypertest-playground**: Example implementation for testing
- **hypertest-docs**: VitePress documentation site
- **hypertest-playwright-container**: Container utilities for Playwright in Lambda

Note: `hypertest-types` must build first (see workspace ordering in root `package.json`).

### Plugin System
Two plugin interfaces in `hypertest-types`:

**TestRunnerPlugin** (`test-runner-plugin.ts`):
- `getCloudFunctionContexts(runId)`: Returns invoke payloads (one per test file)
- `buildImage()`: Builds Docker image with tests

**CloudFunctionProviderPlugin** (`cloud-function-provider.ts`):
- `pullBaseImage()`: Pull pre-built base image
- `pushImage()`: Push built image to registry
- `invoke(payload)`: Invoke cloud function
- `updateLambdaImage()`: Update Lambda with new image

### Execution Flow

**Deploy** (`packages/hypertest-core/src/index.ts:73-89`):
1. Pull base image from ECR
2. Build target image (base + user tests)
3. Push to ECR
4. Update Lambda function

**Invoke** (`packages/hypertest-core/src/index.ts:46-71`):
1. Generate unique `runId`
2. Test runner creates payloads (one per test file)
3. Invoke Lambdas concurrently (up to `concurrency` limit)
4. Collect results from S3

### Key Files
- CLI entry: `packages/hypertest-core/src/cli.ts`
- Core orchestration: `packages/hypertest-core/src/index.ts`
- Type definitions: `packages/hypertest-types/src/index.ts`
- Lambda handler: `packages/hypertest-runner-aws-playwright/src/index.ts`

### Configuration
Projects use `hypertest.config.js`:
```javascript
import { defineConfig } from '@hypertest/hypertest-core';
import playwright from '@hypertest/hypertest-plugin-playwright';
import aws from '@hypertest/hypertest-provider-cloud-aws';

export default defineConfig({
  concurrency: 30,
  imageName: 'your-app/hypertest-playwright',
  testRunner: playwright({}),
  cloudFunctionProvider: aws({
    baseImage: 'account.dkr.ecr.region.amazonaws.com/hypertest/base-playwright:latest',
    region: 'eu-central-1',
    ecrRegistry: 'account.dkr.ecr.region.amazonaws.com',
    functionName: 'your-function-name',
    bucketName: 'your-artifacts-bucket',
  }),
});
```

### Artifact Handling
Tests use `HT_TEST_ARTIFACTS_OUTPUT_PATH` environment variable for cloud artifact storage:
```javascript
await page.screenshot({
  path: `${process.env.HT_TEST_ARTIFACTS_OUTPUT_PATH}/screenshots/test.png`,
});
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
