---
outline: deep
next:
  text: Architecture
  link: /developers/architecture
prev:
  text: Runners overview
  link: /runners/overview
---

# AWS Playwright Runner

The AWS Playwright Runner executes [Playwright](https://playwright.dev/) tests inside [AWS Lambda](https://aws.amazon.com/lambda/) functions. It handles Chromium configuration, test execution, artifact collection, and S3 uploads.

## Overview

This runner is pre-packaged into a base Docker image that includes:

- Node.js runtime
- Playwright test framework
- Chromium browser (Lambda-optimized via `@sparticuz/chromium`)
- ffmpeg for video recording
- AWS SDK for S3 uploads

You don't install this package directly - it's included in the base image you reference in your hypertest configuration.

## How it works

When AWS Lambda invokes the runner, it follows this execution flow:

### 1. Receive event payload

The Lambda handler receives an event with:

```typescript
{
  runId: string;      // Unique identifier for this test run
  testId: string;     // Unique identifier for this specific test
  bucketName: string; // S3 bucket for artifacts
  context: {
    grep: string;     // Regex pattern to match specific test
  }
}
```

### 2. Configure environment

The runner sets up the Lambda environment:

```
/tmp/{runId}/{testId}/           # Test run directory
├── _playwright.config.ts        # Generated config
└── output/                      # Test artifacts
    ├── screenshots/
    ├── videos/
    └── playwright-results.json
```

### 3. Generate Playwright config

A dynamic Playwright configuration is created that:

- Points to your test files at `/tests/`
- Configures Chromium with Lambda-optimized settings
- Sets output directory to `/tmp/{runId}/{testId}/output`
- Forces single worker execution
- Uses JSON reporter for structured results

```javascript
// Generated _playwright.config.ts
userConfig.testDir = path.resolve('/tests', userConfig.testDir);
userConfig.reporter = [['json', { outputFile: '{outputDir}/playwright-results.json' }]];
userConfig.outputDir = '{outputDir}';
userConfig.workers = 1;

// Chromium launch options for Lambda
p.use.launchOptions = {
  args: chromium.args,
  executablePath: await chromium.executablePath(),
  headless: true
};
```

### 4. Setup ffmpeg

For video recording support, the runner creates a symlink from Playwright's expected ffmpeg location to the system binary:

```
/tmp/.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux -> /usr/bin/ffmpeg
```

### 5. Execute test

The runner executes Playwright with the grep pattern:

```bash
HT_TEST_ARTIFACTS_OUTPUT_PATH={outputDir} \
npx playwright test \
  -c {testRunDir}/_playwright.config.ts \
  --grep "{grep}"
```

The `HT_TEST_ARTIFACTS_OUTPUT_PATH` environment variable is available to your tests for saving custom artifacts.

### 6. Upload artifacts

After test execution, all files in the output directory are uploaded to S3:

```
s3://{bucketName}/
└── {runId}/
    └── {testId}/
        ├── playwright-results.json
        ├── screenshots/
        │   └── *.png
        ├── videos/
        │   └── *.webm
        └── traces/
            └── *.zip
```

### 7. Return results

The handler returns a summary:

```typescript
{
  expected: number;   // Count of passed tests
  unexpected: number; // Count of failed tests
  runId: string;
  testId: string;
  grep: string;
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS Lambda Function                      │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Event Payload                     │   │
│  │  { runId, testId, bucketName, context: { grep } }   │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Environment Setup                      │   │
│  │  • Create /tmp/{runId}/{testId}/                    │   │
│  │  • Generate _playwright.config.ts                   │   │
│  │  • Setup ffmpeg symlink                             │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Chromium Configuration                 │   │
│  │  • @sparticuz/chromium for Lambda                   │   │
│  │  • Headless mode enabled                            │   │
│  │  • Lambda-optimized args                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Test Execution                         │   │
│  │  npx playwright test --grep "{pattern}"             │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              S3 Upload                              │   │
│  │  • Scan output directory                            │   │
│  │  • Upload all files with correct MIME types         │   │
│  │  • Organize by runId/testId                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                              │                              │
│                              ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Return Results                         │   │
│  │  { expected, unexpected, runId, testId, grep }      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Using artifacts in tests

Your tests can save custom artifacts using the `HT_TEST_ARTIFACTS_OUTPUT_PATH` environment variable:

```typescript
import { test } from '@playwright/test';

test('save custom artifacts', async ({ page }) => {
  await page.goto('https://example.com');

  // Screenshot
  await page.screenshot({
    path: `${process.env.HT_TEST_ARTIFACTS_OUTPUT_PATH}/screenshots/home.png`,
  });

  // HAR file
  await page.context().tracing.start({ screenshots: true, snapshots: true });
  // ... test actions
  await page.context().tracing.stop({
    path: `${process.env.HT_TEST_ARTIFACTS_OUTPUT_PATH}/traces/trace.zip`,
  });

  // Custom JSON data
  const fs = await import('fs/promises');
  await fs.writeFile(
    `${process.env.HT_TEST_ARTIFACTS_OUTPUT_PATH}/custom-data.json`,
    JSON.stringify({ timestamp: Date.now() }),
  );
});
```

## Lambda configuration

Recommended Lambda function settings for optimal performance:

| Setting | Value | Notes |
|---------|-------|-------|
| Memory | 2048 MB | Minimum for Playwright + Chromium |
| Timeout | 300 seconds | 5 minutes for longer tests |
| Architecture | x86_64 | Required for Chromium binary |
| Ephemeral storage | 512 MB | Default is sufficient |

## Dependencies

The runner uses these key dependencies:

| Package | Purpose |
|---------|---------|
| `@sparticuz/chromium` | Lambda-optimized Chromium binary |
| `@aws-sdk/client-s3` | S3 uploads for artifacts |
| `glob` | File discovery for uploads |
| `mime-types` | Correct Content-Type headers |

## Error handling

The runner handles errors gracefully:

```typescript
// Test execution errors are caught and logged
try {
  execSync(cmd, { stdio: 'inherit' });
} catch (error) {
  console.log('main test run error:', error);
}

// S3 upload failures throw to stop execution
if (!uploadResult.success) {
  throw new Error('Failed to upload test results to S3.');
}

// Handler returns error details on failure
return {
  status: 'error',
  message: err.message,
  stack: err.stack,
};
```

## Limitations

- Single test per invocation (parallelization at Lambda level)
- Chromium only (no Firefox or WebKit in Lambda for now, but more coming soon)
- 15-minute maximum execution time (Lambda limit)
- `/tmp` storage limited to 10 GB
