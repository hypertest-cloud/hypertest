---
outline: deep
next:
  text: Usage
  link: /getting-started/usage
prev:
  text: Installation
  link: /getting-started/installation
---

# Configuration

After installing hypertest, you need to configure it for your project and cloud environment. This guide walks you through creating the necessary configuration files.

## Config file

Create a `hypertest.config.js` file in your project root:

```javascript
import { defineConfig } from '@hypertest/hypertest-core';
import playwright from '@hypertest/hypertest-plugin-playwright';
import aws from '@hypertest/hypertest-provider-cloud-aws';

export default defineConfig({
  // Number of cloud functions to run in parallel
  concurrency: 30,

  // Docker image names for your test container
  imageName: 'your-app/hypertest-playwright',
  localImageName: 'your-app/hypertest-playwright',
  localBaseImageName: 'your-app/hypertest-base-playwright',

  // Test runner plugin configuration
  testRunner: playwright({}),

  // Custom Winston LoggerOptions for the internal logger instance.
  loggerOptions: {},

  // Cloud provider configuration
  cloudFunctionProvider: aws({
    baseImage: 'your-account.dkr.ecr.region.amazonaws.com/hypertest/base-playwright:latest',
    region: 'eu-central-1',
    ecrRegistry: 'your-account.dkr.ecr.region.amazonaws.com',
    functionName: 'your-app-hypertest-playwright',
    bucketName: 'your-app-hypertest-artifacts',
  }),
});
```

## Configuration options

### Core settings

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `concurrency` | number | No | `30` | Maximum number of cloud functions to run simultaneously |
| `imageName` | string | Yes | - | Name for your Docker image with test files |
| `localImageName` | string | No | - | Name for local Docker image used during build |
| `localBaseImageName` | string | No | - | Name for the local base image with hypertest runner |

::: tip
Higher `concurrency` values mean faster execution but more cloud resource usage. Start with 10-30 and increase based on your AWS Lambda quotas.
:::

### Test runner settings

Configure your test framework plugin via the `testRunner` option. See [Plugins](/plugins/overview) for details.

```javascript
testRunner: playwright({
  // Playwright-specific options
})
```

### Cloud provider settings

Configure your cloud infrastructure via the `cloudFunctionProvider` option. See [Clouds](/clouds/overview) for details.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `baseImage` | string | Yes | ECR URI of the base image containing Playwright runner |
| `region` | string | Yes | AWS region (e.g., `eu-central-1`) |
| `ecrRegistry` | string | Yes | Your ECR registry URL |
| `functionName` | string | Yes | Name for your Lambda function |
| `bucketName` | string | Yes | S3 bucket for test artifacts |

```javascript
cloudFunctionProvider: aws({
  baseImage: 'account-id.dkr.ecr.region.amazonaws.com/hypertest/base-playwright:latest',
  region: 'eu-central-1',
  ecrRegistry: 'account-id.dkr.ecr.region.amazonaws.com',
  functionName: 'your-app-hypertest-playwright',
  bucketName: 'your-app-hypertest-artifacts',
})
```

## AWS setup

### 1. Credentials

hypertest auth uses AWS credentials exported as environment variables.

```bash
export AWS_ACCESS_KEY_ID="your-access-key-here"
export AWS_SECRET_ACCESS_KEY="your-secret-key-here"
export AWS_REGION="eu-central-1"
```

### 2. Permissions

hypertest requires specific permissions to deploy and run tests in AWS.

#### IAM User

This user is used by hypertest CLI to build, deploy and invoke tests in the cloud.

##### ECR

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:*"
            ],
            "Resource": "*"
        }
    ]
}
```

##### Lambda

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:CreateFunction",
                "lambda:UpdateFunctionCode",
                "lambda:UpdateFunctionConfiguration",
                "lambda:DeleteFunction",
                "lambda:InvokeFunction",
                "lambda:GetFunction",
                "lambda:GetFunctionConfiguration",
                "lambda:ListFunctions"
            ],
            "Resource": "arn:aws:lambda:*:*:function:*"
        }
    ]
}
```

##### ServiceQuotas

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "servicequotas:GetServiceQuota"
            ],
            "Resource": "arn:aws:servicequotas:eu-central-1:XXXXXXXXXXX:lambda/*"
        }
    ]
}
```

#### Lambda function

Lambda functions require permissions for S3 to store test and run artifacts.

##### S3

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:PutObjectAcl",
                "s3:PutObjectTagging",
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
