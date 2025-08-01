---
outline: deep
next: false
prev:
  text: Configuration
  link: /getting-started/configuration
---

# Usage

Now that you have hypertest installed and configured, this guide will walk you through the complete workflow of deploying and running your tests in the cloud.

## Workflow

hypertest follows a simple two-step process:

1. **Deploy**: Build and deploy your test container to the cloud function.
2. **Run**: Invoke your tests in parallel across cloud functions.

### Deploy your tests

Before you can run tests in the cloud, you need to deploy your test container:

```bash
npx hypertest deploy
```

The `deploy` command performs several operations:

1. **Pulls base image** - Downloads the hypertest base image with all dependencies,
2. **Builds container** - Creates a Docker image containing your tests and configuration,
3. **Pushes to registry** - Uploads the image to AWS ECR,
4. **Updates Lambda** - Creates or updates your AWS Lambda function with the new image.

### Run your tests

After deploying, invoke your tests in the cloud:

```bash
npx hypertest invoke
```

The `invoke` command does the following:

1. **Analyzes tests** - Scans your test directory and identifies individual test files,
2. **Creates contexts** - Generates execution contexts for each test file,
3. **Invokes functions** - Launches cloud functions in parallel (up to your concurrency limit),
4. **Collects results** - Gathers test results, artifacts, and reports in S3 bucket.

## Working with test artifacts

hypertest automatically handles test artifacts like screenshots, videos, and reports and saves them in your configured S3 bucket under your invoke `runId` directory.

### Using artifacts in tests

Reference artifacts paths in your Playwright tests using the `HT_TEST_ARTIFACTS_OUTPUT_PATH` environment variable:

```javascript
// Save screenshot
await page.screenshot({
  path: `${process.env.HT_TEST_ARTIFACTS_OUTPUT_PATH}/screenshots/my-test.png`,
});

// Save HAR file
await page.routeFromHAR(
  `${process.env.HT_TEST_ARTIFACTS_OUTPUT_PATH}/hars/my-test.har`,
  { update: true }
);
```
