---
outline: deep
next:
  text: AWS
  link: /clouds/aws
prev:
  text: Playwright
  link: /plugins/playwright
---

# Clouds overview

Cloud providers are the infrastructure layer of hypertest. They handle deploying your test containers and executing tests across serverless functions in your cloud environment.

## What are cloud providers?

A cloud provider in hypertest is a package that connects to your cloud infrastructure. It manages all cloud-specific operations like authenticating with registries, pushing Docker images, invoking serverless functions, and collecting results.

## How cloud providers work

When you run hypertest commands, the cloud provider handles infrastructure operations:

1. **Authentication** - The provider authenticates with your cloud's container registry and serverless platform.

2. **Image Management** - During deploy, the provider pulls base images, tags your test images, and pushes them to the cloud registry.

3. **Function Invocation** - During invoke, the provider triggers serverless functions with test payloads and handles concurrency limits.

4. **Result Collection** - Test artifacts and results are stored in cloud storage and made available after execution.

## Using a cloud provider

Cloud providers are configured in your `hypertest.config.js` file via the `cloudFunctionProvider` option:

```javascript
import { defineConfig } from '@hypertest/hypertest-core';
import aws from '@hypertest/hypertest-provider-cloud-aws';

export default defineConfig({
  cloudFunctionProvider: aws({
    region: 'eu-central-1',
    functionName: 'my-tests',
    bucketName: 'my-artifacts',
    // ... provider-specific options
  }),
  // ... other options
});
```

Each provider requires its own configuration options specific to that cloud platform.

## Available providers

| Provider | Package | Description |
|----------|---------|-------------|
| AWS | `@hypertest/hypertest-provider-cloud-aws` | AWS Lambda with ECR and S3 |

More cloud providers are coming soon.

## Provider architecture

Under the hood, each provider implements the `CloudFunctionProviderPluginDefinition` interface with:

- **name** - Unique identifier for the provider
- **version** - Provider version for compatibility tracking
- **validate** - Validates configuration and cloud connectivity
- **getCliDoctorChecks** - Health checks for cloud resources (quotas, permissions)
- **handler** - Factory function that creates the provider instance

The provider instance exposes these operations:

- **pullBaseImage** - Downloads the base runner image from cloud registry
- **pushImage** - Uploads your test image to cloud registry
- **updateLambdaImage** - Updates the serverless function with new image
- **invoke** - Executes a single test in a serverless function
