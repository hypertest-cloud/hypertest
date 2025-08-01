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

This guide walks you through installing hypertest packages for your project.

## Prerequisites

Before installing hypertest, ensure you have:

- **Node.js** version 20 or higher,
- **npm**, **yarn**, or **pnpm** package manager,
- An existing **Playwright** test suite,
- **Docker** installed (for container builds).

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

## Verify installation

Check that hypertest is properly installed:

```bash
npx hypertest --version
```

You should see the version number of your installed hypertest core package.
