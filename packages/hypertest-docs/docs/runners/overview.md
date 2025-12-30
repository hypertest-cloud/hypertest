---
outline: deep
next:
  text: AWS Playwright
  link: /runners/aws-playwright
prev:
  text: AWS
  link: /clouds/aws
---

# Runners overview

Runners are the execution layer of hypertest. They are the actual code that runs inside cloud functions, executing your tests and collecting results.

## What are runners?

A runner in hypertest is a package that executes inside a serverless function (like AWS Lambda). It receives test payloads, runs the appropriate test framework commands, and uploads results to cloud storage.

Runners are the bridge between hypertest's orchestration layer and your test framework. They handle all the cloud-specific setup required to run tests in serverless environments.

## How runners work

When a cloud function is invoked, the runner:

1. **Receives Payload** - Gets test information including run ID, test ID, and test-specific context (like grep patterns).

2. **Configures Environment** - Sets up the test framework with cloud-optimized settings (browser paths, output directories, workers).

3. **Executes Tests** - Runs the test framework command with the specific test filter.

4. **Collects Artifacts** - Gathers all test outputs (screenshots, videos, reports).

5. **Uploads Results** - Sends artifacts to cloud storage organized by run and test ID.

6. **Returns Summary** - Provides execution results back to the orchestrator.

## Runner vs Plugin vs Provider

Understanding how these components work together:

| Component | Location | Purpose |
|-----------|----------|---------|
| **Plugin** | Your machine | Discovers tests, builds images, prepares payloads |
| **Provider** | Your machine | Handles cloud authentication and invocation |
| **Runner** | Cloud function | Executes tests in the serverless environment |

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Machine                            │
│  ┌─────────────────┐         ┌─────────────────┐           │
│  │     Plugin      │         │    Provider     │           │
│  │  (Playwright)   │         │     (AWS)       │           │
│  └────────┬────────┘         └────────┬────────┘           │
│           │                           │                     │
│           │  Test payloads            │  Invoke             │
│           └───────────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Cloud Function                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                     Runner                          │   │
│  │              (AWS Playwright)                       │   │
│  │                                                     │   │
│  │  • Configure Chromium for Lambda                    │   │
│  │  • Run Playwright with grep filter                  │   │
│  │  • Upload artifacts to S3                           │   │
│  │  • Return test results                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Available runners

| Runner | Package | Description |
|--------|---------|-------------|
| AWS Playwright | `@hypertest/hypertest-runner-aws-playwright` | Playwright execution on AWS Lambda |

More runners for other cloud and framework combinations are coming soon.

## Runner architecture

Runners are packaged into Docker images that serve as the base for your test containers. The typical structure:

```
Base Image (Runner)
├── Node.js runtime
├── Test framework (Playwright)
├── Browser binaries (Chromium)
├── System dependencies (ffmpeg)
└── Runner handler code

Your Test Image (Built on Base)
├── Base Image (above)
├── Your test files
└── Your playwright.config.js
```

This layered approach means:
- Base images are pre-built with heavy dependencies
- Your test images only add your code
- Deployments are fast since base image is cached
