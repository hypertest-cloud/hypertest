# Hypertest

Revolutionize your testing with our **plug-and-play TypeScript library**. Effortlessly integrates, distributing tests in the cloud to **cut runtime to just your slowest test**. Exceptionally affordable for fast, cost-effective development.

## Why Hypertest?

Modern test suites can take 10, 30, or even 60+ minutes to complete. Hypertest solves this by running each test file in a separate cloud function, transforming sequential execution into massive parallelization.

- **Massive speed improvements** — Reduce test suite time to your longest individual test
- **Near-zero cost** — Pay only for compute time, scales to zero when idle
- **Plug and play** — Works with your existing Playwright tests
- **Cloud agnostic** — Start with AWS Lambda, expand to other providers

## Quick Start

### Installation

```bash
npm install @hypertest/hypertest-core @hypertest/hypertest-plugin-playwright @hypertest/hypertest-provider-cloud-aws
```

### Configuration

Create `hypertest.config.js` in your project root:

```javascript
import { defineConfig } from '@hypertest/hypertest-core';
import playwright from '@hypertest/hypertest-plugin-playwright';
import aws from '@hypertest/hypertest-provider-cloud-aws';

export default defineConfig({
  concurrency: 30,
  imageName: 'your-app/hypertest-playwright',
  testRunner: playwright({}),
  cloudFunctionProvider: aws({
    baseImage: 'your-ecr-registry/hypertest/base-playwright:latest',
    region: 'eu-central-1',
    ecrRegistry: 'your-ecr-registry',
    functionName: 'your-function-name',
    bucketName: 'your-artifacts-bucket',
  }),
});
```

### Usage

```bash
npx hypertest deploy    # Build and deploy test image to AWS
npx hypertest invoke    # Run tests in cloud
```

## Documentation

Full documentation available at [packages/hypertest-docs](./packages/hypertest-docs) including:

- [Installation](./packages/hypertest-docs/docs/getting-started/installation.md)
- [Configuration](./packages/hypertest-docs/docs/getting-started/configuration.md)
- [Usage](./packages/hypertest-docs/docs/getting-started/usage.md)
- [Architecture](./packages/hypertest-docs/docs/developers/architecture.md)

## Prerequisites

- Node.js 20+
- Docker
- AWS account with ECR, Lambda, and S3 configured

## Contributing

### Setup

TODO: Add setup instructions

### Development

TODO: Add development instructions

### Project Structure

| Package | Description |
|---------|-------------|
| `hypertest-core` | CLI and orchestration |
| `hypertest-types` | Shared TypeScript interfaces |
| `hypertest-plugin-playwright` | Playwright integration |
| `hypertest-provider-cloud-aws` | AWS cloud provider |
| `hypertest-runner-aws-playwright` | Lambda execution handler |
| `hypertest-playground` | Example implementation |
| `hypertest-docs` | Documentation site |

## Community

- [GitHub Issues](https://github.com/hypertest-cloud/hypertest/issues)
- [Discord](https://discord.gg/Ud9E86JCM3)

## License

Hypertest is licensed under the [Elastic License 2.0 (ELv2)](./LICENSE.md).

The ELv2 license grants you free use, modification, and redistribution of the software with the following restrictions:

- You may not provide the software to third parties as a hosted or managed service
- You may not remove or obscure licensing notices
- You may not circumvent license key functionality

For more information, see our [License FAQ](./packages/hypertest-docs/docs/license/faq.md).
