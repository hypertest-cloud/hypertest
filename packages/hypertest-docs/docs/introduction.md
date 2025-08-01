---
outline: deep
next:
  text: Installation
  link: /getting-started/installation
---

# Introduction

hypertest is a revolutionary **plug-and-play TypeScript library** that transforms how you run your test suites. Instead of waiting for your entire test suite to complete sequentially, hypertest distributes your tests across cloud infrastructure, cutting your total runtime down to **just your slowest individual test**. Exceptionally affordable for fast, cost-effective development.

## The problem we solve

Modern applications have comprehensive test suites that can take 10, 30, or even 60+ minutes to complete. This creates bottlenecks in your development workflow:

- **Slow CI/CD pipelines** that delay releases,
- **Developer productivity loss** waiting for test feedback,
- **Frustration** with long-running tests that block feature development,
- **Resource waste** running tests on expensive CI runners or third-party services,
- **Scaling challenges** as your test suite grows.

## How hypertest works

hypertest uses a **cloud-first approach** to test distribution:

1. **Analyze** - hypertest examines your test suite and identifies individual test files.
2. **Distribute** - Each test file is packaged and sent to a separate cloud function.
3. **Execute** - Tests run in parallel across multiple cloud functions instances at once.
4. **Collect** - Results are gathered and presented as a unified report.

## Key benefits

#### Massive speed improvements

Transform your test suite from running sequentially to running in parallel across multiple cloud functions. This can reduce your whole test suite execution time to the length of your longest test.

#### Almost zero cost infrastructure
Pay only for the compute time you actually use. Cloud functions scale to zero when not in use, making this exceptionally affordable, and costs cents when running.

#### Plug and Play
Integrate with your existing test framework (Playwright, more coming soon...) with minimal configuration changes on your end.

#### Cloud agnostic
Start with AWS cloud (and AWS Lambda as cloud functions), but easily switch to other cloud providers as your needs evolve (coming soon).

#### Unified reporting
Get the same test reports and artifacts you're used to, just delivered much faster.

## Who should use hypertest?

hypertest is a perfect tool for:

- **Development teams** with growing test suites slowing down their workflow,
- **CI/CD pipelines** that need faster feedback loops,
- **Organizations** looking to optimize their testing infrastructure costs,
- **Projects** using modern test frameworks like Playwright.

## Real-world impact

Teams using hypertest typically see:

- **Significant reduction** in test suite execution time and test infrastructure costs,
- **Improved developer productivity** with faster feedback loops,
- **Faster release cycles** as features can be tested and deployed more quickly,
- **Quality improvements** as developers can run more tests in less time,
- **Better test coverage** as fast tests encourage more comprehensive testing.
