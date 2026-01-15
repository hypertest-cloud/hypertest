---
outline: deep
next:
  text: Plugins overview
  link: /plugins/overview
prev:
  text: Configuration
  link: /getting-started/configuration
---

# Usage

Now that you have hypertest installed and configured, this guide walks you through the complete workflow of deploying and running your tests in the cloud.

## Workflow overview

hypertest follows a simple two-phase process:

```
┌─────────────────┐         ┌─────────────────┐
│     Deploy      │   ───►  │     Invoke      │
│  (build image)  │         │  (run tests)    │
└─────────────────┘         └─────────────────┘
```

1. **Deploy** - Build and push your test container to the cloud
2. **Invoke** - Run your tests in parallel across cloud functions

## Deploy your tests

Before running tests in the cloud, deploy your test container:

```bash
npx hypertest deploy
```

The `deploy` command performs these operations:

1. **Pulls base image** - Downloads the hypertest base image with Playwright and dependencies
2. **Builds container** - Creates a Docker image containing your tests and configuration
3. **Pushes to registry** - Uploads the image to AWS ECR
4. **Updates Lambda** - Points your Lambda function to the new image

::: tip When to redeploy
You only need to run `deploy` when your test files or Playwright configuration change. If you're just re-running existing tests, skip straight to `invoke`.
:::

## Run your tests

After deploying, invoke your tests in the cloud:

```bash
npx hypertest invoke
```

The `invoke` command:

1. **Analyzes tests** - Scans your test directory and identifies individual test files
2. **Creates payloads** - Generates execution context for each test
3. **Invokes functions** - Launches Lambda functions in parallel (up to your `concurrency` limit)
4. **Collects results** - Gathers test results and artifacts from S3

## Development workflow

A typical development cycle looks like this:

```bash
# 1. Write or modify your Playwright tests locally
# 2. Test locally first
npx playwright test

# 3. Deploy to cloud (only needed when tests change)
npx hypertest deploy

# 4. Run tests in cloud
npx hypertest invoke

# 5. Check results in S3 bucket
```

::: tip Local testing first
Always run your tests locally with `npx playwright test` before deploying to catch obvious issues without waiting for cloud deployment.
:::

## Working with test artifacts

hypertest automatically handles test artifacts like screenshots, videos, and reports. Artifacts are saved to your configured S3 bucket organized by run ID.

### Artifact structure in S3

```
s3://your-bucket/
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

### Saving artifacts in tests

Use the `HT_TEST_ARTIFACTS_OUTPUT_PATH` environment variable to save custom artifacts:

```typescript
import { test } from '@playwright/test';

test('example with artifacts', async ({ page }) => {
  await page.goto('https://example.com');

  // Save screenshot
  await page.screenshot({
    path: `${process.env.HT_TEST_ARTIFACTS_OUTPUT_PATH}/screenshots/home.png`,
  });

  // Save trace
  await page.context().tracing.start({ screenshots: true, snapshots: true });
  // ... test actions
  await page.context().tracing.stop({
    path: `${process.env.HT_TEST_ARTIFACTS_OUTPUT_PATH}/traces/trace.zip`,
  });
});
```

## CI/CD integration

hypertest integrates seamlessly with CI/CD pipelines. Example GitHub Actions workflow:

```yaml
name: E2E Tests

on: [push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Deploy tests
        run: npx hypertest deploy
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: eu-central-1

      - name: Run tests
        run: npx hypertest invoke
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: eu-central-1
```

::: warning
Store AWS credentials as repository secrets. Never commit credentials to your repository.
:::
