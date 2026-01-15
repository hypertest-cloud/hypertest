---
outline: deep
next:
  text: Playwright
  link: /plugins/playwright
prev:
  text: Usage
  link: /getting-started/usage
---

# Plugins overview

Plugins are the foundation of hypertest's extensible architecture. They allow hypertest to integrate with different test frameworks while keeping the core system framework-agnostic.

## What are plugins?

A plugin in hypertest is a package that connects your test framework to the hypertest ecosystem. It handles all framework-specific operations like discovering tests, preparing execution payloads, and building Docker images with the correct dependencies.

## How plugins work

When you run hypertest commands, plugins handle the framework-specific logic:

1. **Test Discovery** - The plugin scans your project and identifies individual test files to distribute across cloud functions.

2. **Payload Preparation** - For each test file, the plugin creates an invoke payload containing all the information needed to run that specific test in the cloud.

3. **Image Building** - The plugin builds a Docker image that includes your tests and all required framework dependencies.

## Using a plugin

Plugins are configured in your `hypertest.config.js` file via the `testRunner` option:

```javascript
import { defineConfig } from '@hypertest/hypertest-core';
import playwright from '@hypertest/hypertest-plugin-playwright';

export default defineConfig({
  testRunner: playwright({}),
  // ... other options
});
```

Each plugin may accept its own configuration options passed to its factory function.

## Available plugins

| Plugin | Package | Description |
|--------|---------|-------------|
| Playwright | `@hypertest/hypertest-plugin-playwright` | Integration for Playwright test framework |

More plugins for other test frameworks are coming soon.

## Plugin architecture

Under the hood, each plugin implements the `TestRunnerPluginDefinition` interface with:

- **name** - Unique identifier for the plugin
- **version** - Plugin version for compatibility tracking
- **validate** - Validates that the plugin can run in the current environment
- **handler** - Factory function that creates the plugin instance

This standardized interface ensures consistent behavior across all plugins while allowing framework-specific customization.
