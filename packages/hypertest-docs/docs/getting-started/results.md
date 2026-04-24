---
outline: deep
prev:
  text: Usage
  link: /getting-started/usage
next:
  text: Plugins overview
  link: /plugins/overview
---

# Results

After every `hypertest invoke` run, hypertest writes a results file (default: `hypertest.results.json`) summarising the entire run and each individual test outcome.

## Where results are saved

Results are saved in two places automatically:

| Location | Path | Purpose |
|---|---|---|
| **Local** | `./{resultsFileName}` (your working directory) | Immediate access — readable by CI systems, developers, and reporting tools |
| **Cloud storage** | `{runId}/{resultsFileName}` | Durable storage alongside per-test artifacts for cross-run history and future tooling |

The filename defaults to `hypertest.results.json` and can be customised via the [`resultsFileName`](/getting-started/configuration#core-settings) config option.

## File structure

```json
{
  "runId": "a1b2c3d4-...",
  "startDate": "2026-04-20T10:00:00.000Z",
  "endDate": "2026-04-20T10:00:47.321Z",
  "duration": 47321,
  "tests": {
    "total": 34,
    "success": 30,
    "skipped": 1,
    "failed": 3
  },
  "results": [
    {
      "testId": "e5f6g7h8-...",
      "name": "Todo App > should add a new item",
      "filePath": "tests/todo.spec.ts",
      "status": "success",
      "startDate": "2026-04-20T10:00:01.100Z",
      "endDate": "2026-04-20T10:00:03.850Z",
      "duration": 2104
    },
    {
      "testId": "i9j0k1l2-...",
      "name": "Todo App > should edit an item",
      "filePath": "tests/todo.spec.ts",
      "status": "failed",
      "startDate": "2026-04-20T10:00:01.200Z",
      "endDate": "2026-04-20T10:00:06.900Z",
      "duration": 5700,
      "error": {
        "message": "Expected 'Buy milk' to equal 'Buy bread'",
        "stackTrace": "Error: Expected 'Buy milk' to equal 'Buy bread'\n    at ..."
      }
    },
    {
      "testId": "m3n4o5p6-...",
      "name": "Todo App > should mark all items complete",
      "filePath": "tests/todo.spec.ts",
      "status": "skipped",
      "startDate": "2026-04-20T10:00:01.300Z",
      "endDate": "2026-04-20T10:00:01.850Z",
      "duration": 550
    }
  ]
}
```

## Field reference

### Run-level fields

| Field | Type | Description |
|---|---|---|
| `runId` | `string` | Unique UUID for this invoke run. Used to locate cloud artifacts at `{runId}/`. |
| `startDate` | `string` | ISO 8601 timestamp when the run started (before cloud manifest is fetched). |
| `endDate` | `string` | ISO 8601 timestamp when all invocations completed. |
| `duration` | `number` | Total run duration in milliseconds. |
| `tests.total` | `number` | Total number of tests invoked. |
| `tests.success` | `number` | Number of tests that passed. |
| `tests.skipped` | `number` | Number of tests that were skipped. |
| `tests.failed` | `number` | Number of tests that failed. |
| `results` | `array` | Per-test result entries (one per test invocation). |

### Per-test fields

| Field | Type | Description |
|---|---|---|
| `testId` | `string` | Unique UUID for this test invocation. Used to locate per-test artifacts at `{runId}/{testId}/`. |
| `name` | `string` | Full test name including suite hierarchy, e.g. `Suite > Nested > Test name`. |
| `filePath` | `string` | Path to the test file relative to the project root. |
| `status` | `string` | Test outcome: `"success"`, `"failed"`, or `"skipped"`. |
| `startDate` | `string` | ISO 8601 timestamp when this test invocation started. |
| `endDate` | `string` | ISO 8601 timestamp when this test invocation completed. |
| `duration` | `number` | Duration in milliseconds. For successful tests, this is the Playwright test execution time. For failed and skipped tests, this is the total invocation time measured by the orchestrator. |
| `error.message` | `string` | Error message from the test failure. Only present when `status` is `"failed"`. |
| `error.stackTrace` | `string` | Full stack trace from the test failure. Only present when `status` is `"failed"`. |

## Using results in CI/CD

The local results file is available immediately after `invoke` completes. You can upload it as a CI artifact for inspection or feed it into reporting tools.

### GitHub Actions example

```yaml
- name: Run tests
  run: npx hypertest invoke

- name: Upload results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: hypertest-results
    path: hypertest.results.json  # update if you set a custom resultsFileName
```

::: tip Use `if: always()`
Upload the results file even when tests fail so you can inspect which tests caused the failure.
:::

## Correlating results with artifacts

Each test entry in `results` carries a `testId` that matches the path structure in cloud storage. Use it to link a failed test to its screenshots, traces, or videos:

```
{cloud-bucket}/
└── {runId}/
    ├── {resultsFileName}   (default: hypertest.results.json)
    └── {testId}/
        └── .../
```
