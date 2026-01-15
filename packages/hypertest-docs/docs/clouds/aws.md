---
outline: deep
next:
  text: Runners overview
  link: /runners/overview
prev:
  text: Clouds overview
  link: /clouds/overview
---

# AWS provider

The AWS provider enables hypertest to run your tests on [AWS Lambda](https://aws.amazon.com/lambda/) functions. It uses ECR for container storage and S3 for test artifacts.

## Installation

::: code-group

```bash [npm]
npm install @hypertest/hypertest-provider-cloud-aws
```

```bash [yarn]
yarn add @hypertest/hypertest-provider-cloud-aws
```

```bash [pnpm]
pnpm add @hypertest/hypertest-provider-cloud-aws
```

:::

## Configuration

Add the provider to your `hypertest.config.js`:

```javascript
import { defineConfig } from '@hypertest/hypertest-core';
import playwright from '@hypertest/hypertest-plugin-playwright';
import aws from '@hypertest/hypertest-provider-cloud-aws';

export default defineConfig({
  concurrency: 30,
  imageName: 'my-app/hypertest-playwright',
  localImageName: 'my-app/hypertest-playwright',
  localBaseImageName: 'my-app/hypertest-base-playwright',
  testRunner: playwright({}),
  cloudFunctionProvider: aws({
    baseImage: '123456789.dkr.ecr.eu-central-1.amazonaws.com/hypertest/base-playwright:latest',
    region: 'eu-central-1',
    ecrRegistry: '123456789.dkr.ecr.eu-central-1.amazonaws.com',
    functionName: 'my-app-hypertest-playwright',
    bucketName: 'my-app-hypertest-artifacts',
  }),
});
```

## Configuration options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `baseImage` | string | Yes | ECR URI of the base image containing Playwright runner |
| `region` | string | Yes | AWS region for all resources (e.g., `eu-central-1`) |
| `ecrRegistry` | string | Yes | Your ECR registry URL |
| `functionName` | string | Yes | Name of your Lambda function |
| `bucketName` | string | Yes | S3 bucket for test artifacts |

## AWS resources

The provider requires these AWS resources to be set up:

### ECR Repository

Container registry to store your test images.

```
your-account.dkr.ecr.region.amazonaws.com/your-app/hypertest-playwright
```

### Lambda Function

Serverless function configured to run container images. Recommended settings:

- **Runtime**: Container image
- **Memory**: 2048 MB (minimum for Playwright)
- **Timeout**: 300 seconds (5 minutes)
- **Architecture**: x86_64

### S3 Bucket

Storage for test artifacts (screenshots, videos, reports).

```
your-app-hypertest-artifacts/
├── {runId}/
│   ├── {testId}/
│   │   ├── screenshots/
│   │   ├── videos/
│   │   └── playwright-results.json
```

## Authentication

The provider uses AWS credentials from environment variables:

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="eu-central-1"
```

Credentials are loaded using the AWS SDK's `fromEnv()` credential provider.

## How it works

The AWS provider performs four main operations:

### Pull base image

During `hypertest deploy`, the provider:

1. Authenticates with ECR using `GetAuthorizationToken`
2. Logs into Docker registry with ECR credentials
3. Pulls the base image containing Playwright and dependencies
4. Tags it locally for use in image building

```
docker pull {baseImage}
docker tag {baseImage} {localBaseImageName}
```

### Push image

After the test image is built:

1. Re-authenticates with ECR
2. Tags local image with ECR repository path
3. Pushes image to ECR

```
docker tag {localImageName} {ecrRegistry}/{imageName}:latest
docker push {ecrRegistry}/{imageName}:latest
```

### Update Lambda

After pushing the image:

1. Calls `UpdateFunctionCode` API
2. Points Lambda to the new image URI
3. Lambda downloads and prepares the new image

### Invoke tests

During `hypertest invoke`:

1. Creates invoke payload with test context and S3 bucket name
2. Calls Lambda `Invoke` API with `RequestResponse` type
3. Waits for execution to complete
4. Returns JSON result from Lambda

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    hypertest deploy                         │
└─────────────────────────────────────────────────────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  Pull Base    │   │  Push Image   │   │ Update Lambda │
│    Image      │   │   to ECR      │   │    Function   │
└───────────────┘   └───────────────┘   └───────────────┘
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│     ECR       │   │     ECR       │   │    Lambda     │
│  (pull auth)  │   │  (push auth)  │   │  (update)     │
└───────────────┘   └───────────────┘   └───────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    hypertest invoke                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Concurrent Lambda Invocations                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Test 1   │ │ Test 2   │ │ Test 3   │ │ Test N   │       │
│  │ Lambda   │ │ Lambda   │ │ Lambda   │ │ Lambda   │       │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │
│       │            │            │            │              │
│       ▼            ▼            ▼            ▼              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    S3 Bucket                        │   │
│  │              (test artifacts)                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## IAM permissions

### IAM User (for CLI)

The user running hypertest CLI needs these permissions:

#### ECR permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["ecr:*"],
      "Resource": "*"
    }
  ]
}
```

#### Lambda permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:UpdateFunctionCode",
        "lambda:InvokeFunction",
        "lambda:GetFunction"
      ],
      "Resource": "arn:aws:lambda:*:*:function:*"
    }
  ]
}
```

#### Service Quotas permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["servicequotas:GetServiceQuota"],
      "Resource": "*"
    }
  ]
}
```

### Lambda execution role

The Lambda function needs S3 permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-artifacts/*",
        "arn:aws:s3:::your-bucket-artifacts"
      ]
    }
  ]
}
```

## Concurrency limits

AWS Lambda has default concurrency limits per account per region. The provider includes a built-in health check that verifies your configured `concurrency` doesn't exceed your account's Lambda quota.

If you hit rate limits (HTTP 429), you can request a quota increase:

1. Go to AWS Service Quotas console
2. Navigate to Lambda service
3. Request increase for "Concurrent executions" quota

::: tip
Start with a lower `concurrency` value (e.g., 10-30) and increase gradually as needed.
:::

## Troubleshooting

### ECR authentication failures

- Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set
- Check IAM user has ECR permissions
- Ensure ECR repository exists in the specified region

### Lambda invocation errors

- Check Lambda function memory (minimum 2048 MB for Playwright)
- Verify Lambda timeout is sufficient (300+ seconds)
- Ensure Lambda execution role has S3 permissions

### Rate limit errors (429)

- Reduce `concurrency` in hypertest config
- Request Lambda concurrency quota increase from AWS
- Check CloudWatch for throttling metrics
