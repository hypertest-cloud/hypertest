---
outline: deep
next:
  text: Clouds overview
  link: /clouds/overview
prev:
  text: Plugins overview
  link: /plugins/overview
---

# Playwright plugin

The Playwright plugin enables hypertest to distribute your [Playwright](https://playwright.dev/) test suite across cloud functions.

## Installation

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

## Configuration

Add the plugin to your `hypertest.config.js`:

```javascript
import { defineConfig } from '@hypertest/hypertest-core';
import playwright from '@hypertest/hypertest-plugin-playwright';
import aws from '@hypertest/hypertest-provider-cloud-aws';

export default defineConfig({
  testRunner: playwright({}),
  // ... other options
});
```

## Playwright configuration requirements

The plugin reads your existing `playwright.config.js` file from the project root. Your configuration must include:

### Required settings

- **testDir** - Directory containing your test files
- **projects** - At least one project with a `name` property

### Example playwright.config.js

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ['json', { outputFile: 'test-artifacts/output/playwright-results.json' }],
  ],
  use: {
    trace: 'on-first-retry',
    video: 'off',
  },
  outputDir: 'test-artifacts/output',
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chromium',
        headless: true,
      },
    },
  ],
});
```

::: tip
Set `workers: 1` in your Playwright config since each cloud function runs a single test. Parallelization happens at the cloud function level, not within Playwright.
:::

## How it works

The Playwright plugin performs two main operations during hypertest execution:

### Test discovery

When you run `hypertest invoke`, the plugin:

1. Reads your `playwright.config.js` to find the test directory and project name
2. Recursively scans for all `.spec.ts` files in the test directory
3. Parses each test file to extract individual test names and their describe blocks
4. Generates a unique grep pattern for each test to enable isolated execution

### Image building

When you run `hypertest deploy`, the plugin:

1. Uses a pre-built base image containing Playwright, Chromium, and dependencies
2. Creates a Docker image that includes your test files and Playwright configuration
3. Tags the image for deployment to your cloud registry

## Test file structure

The plugin discovers tests by scanning for files ending with `.spec.ts` in your configured `testDir`. Tests are identified by their full path including any `describe` blocks:

```typescript
// tests/auth/login.spec.ts
import { test } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login with valid credentials', async ({ page }) => {
    // This test will be identified as:
    // "chromium tests/auth/login.spec.ts Authentication should login with valid credentials"
  });

  test('should show error for invalid password', async ({ page }) => {
    // This test will be identified as:
    // "chromium tests/auth/login.spec.ts Authentication should show error for invalid password"
  });
});
```

## Saving test artifacts

Tests running in the cloud can save artifacts using the `HT_TEST_ARTIFACTS_OUTPUT_PATH` environment variable:

```typescript
import { test } from '@playwright/test';

test('capture screenshot on action', async ({ page }) => {
  await page.goto('https://example.com');

  // Save screenshot to artifacts directory
  await page.screenshot({
    path: `${process.env.HT_TEST_ARTIFACTS_OUTPUT_PATH}/screenshots/example.png`,
  });
});
```

Artifacts are automatically uploaded to S3 after test execution and organized by run ID.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    hypertest invoke                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Playwright Plugin                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  1. Read playwright.config.js                       │   │
│  │  2. Scan testDir for .spec.ts files                 │   │
│  │  3. Parse tests and describe blocks                 │   │
│  │  4. Generate grep patterns for each test            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloud Function Payloads                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Test 1     │ │   Test 2     │ │   Test N     │        │
│  │  grep: "^.." │ │  grep: "^.." │ │  grep: "^.." │        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              AWS Lambda Execution                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  npx playwright test --grep "^pattern$"             │   │
│  │  → Runs single test in isolated environment         │   │
│  │  → Uploads artifacts to S3                          │   │
│  │  → Returns JSON results                             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Limitations

- Only `.spec.ts` files are discovered (TypeScript required)
- Single project support (uses first project in config)
- Tests must be compatible with headless Chromium execution
