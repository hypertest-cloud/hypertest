---
outline: deep
next:
  text: Configuration
  link: /getting-started/configuration
prev:
  text: Introduction
  link: /introduction
---

# Installation

This guide walks you through installing hypertest packages for your project. hypertest uses a modular architecture where you install the core package along with plugins for your test framework and cloud provider.

## Prerequisites

Before installing hypertest, ensure you have:

- [Node.js](https://nodejs.org/) version 22 or higher
- **npm**, **yarn**, or **pnpm** package manager
- An existing [Playwright](https://playwright.dev/) test suite
- [Docker](https://www.docker.com/) installed and running

## Core

Install the main hypertest package.

::: code-group

```bash [npm]
npm install @hypertest/hypertest-core
```

```bash [yarn]
yarn add @hypertest/hypertest-core
```

```bash [pnpm]
pnpm add @hypertest/hypertest-core
```

:::

## Plugins

Install plugin for your test framework.

### Playwright

::: code-group

```bash [npm]
npm install @hypertest/hypertest-plugin-playwright
```

```bash [yarn]
yarn add @hypertest/hypertest-plugin-playwright
```

```bash [pnpm]
pnpm add @hypertest/hypertest-plugin-playwright
```

:::

## Cloud providers

Install the cloud provider of cloud you want to use.

### AWS

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

## All-in-one installation

Install all packages at once for the standard Playwright + AWS setup:

::: code-group

```bash [npm]
npm install @hypertest/hypertest-core @hypertest/hypertest-plugin-playwright @hypertest/hypertest-provider-cloud-aws
```

```bash [yarn]
yarn add @hypertest/hypertest-core @hypertest/hypertest-plugin-playwright @hypertest/hypertest-provider-cloud-aws
```

```bash [pnpm]
pnpm add @hypertest/hypertest-core @hypertest/hypertest-plugin-playwright @hypertest/hypertest-provider-cloud-aws
```

:::

## Verify installation

Check that hypertest is properly installed:

```bash
npx hypertest --version
```

You should see the version number of your installed hypertest core package.

## Create your config

Run the interactive setup wizard to generate `hypertest.config.js`:

```bash
npx hypertest init
```

The wizard prompts for your image name, AWS region, ECR registry, Lambda function name, and S3 bucket, then writes a ready-to-use config file in your project root.

::: tip Next steps
After installation, proceed to [Configuration](/getting-started/configuration) to review all available options or to set up AWS credentials.
:::
