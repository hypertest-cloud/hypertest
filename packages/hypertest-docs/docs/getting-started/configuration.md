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

**`concurrency`**
- **Type**: `number`
- **Default**: `30`
- **Description**: Maximum number of cloud functions to run simultaneously. Higher values = faster execution but more cloud resource usage and heavier load on your application.

**`imageName`**
- **Type**: `string`
- **Required**: Yes
- **Description**: Name for your Docker image with your test files that will be built and deployed to the cloud function.

**`localImageName`**
- **Type**: `string`
- **Description**: Name for local Docker image with your test files that will be built and deployed to the cloud function.

**`localBaseImageName`**
- **Type**: `string`
- **Description**: Name for the local base Docker image with hypertest runner for cloud function used for building your test container.

### Test runner settings

#### Playwright plugin

```javascript
testRunner: playwright({
  // Playwright-specific options go here
  // Currently accepts empty object
})
```

### Cloud provider settings

#### AWS provider

```javascript
cloudFunctionProvider: aws({
  baseImage: 'account-id.dkr.ecr.region.amazonaws.com/hypertest/base-playwright:latest',
  region: 'eu-central-1',
  ecrRegistry: 'account-id.dkr.ecr.region.amazonaws.com',
  functionName: 'your-app-hypertest-playwright',
  bucketName: 'your-app-hypertest-artifacts',
})
```

**`baseImage`**
- **Type**: `string`
- **Required**: Yes
- **Description**: Base Docker image containing hypertest runner for Playwright, AWS and dependencies. Use hypertest's pre-built images or your own.

**`region`**
- **Type**: `string`
- **Required**: Yes
- **Description**: AWS region for your Lambda functions and resources (e.g., `us-east-1`, `eu-central-1`).

**`ecrRegistry`**
- **Type**: `string`
- **Required**: Yes
- **Description**: Your AWS ECR registry URL where Docker images will be stored.

**`functionName`**
- **Type**: `string`
- **Required**: Yes
- **Description**: Name for your AWS Lambda function. Must be unique in your AWS account.

**`bucketName`**
- **Type**: `string`
- **Required**: Yes
- **Description**: S3 bucket name for storing test artifacts, screenshots, videos and reports.

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
