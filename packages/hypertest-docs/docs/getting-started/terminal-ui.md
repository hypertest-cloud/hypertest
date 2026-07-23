---
outline: deep
prev:
  text: CLI Reference
  link: /getting-started/cli-reference
next:
  text: Plugins overview
  link: /plugins/overview
---

# Terminal output

hypertest renders different output depending on whether it is running in an interactive terminal or in a non-interactive environment (CI, piped output, `--quiet`).

## Interactive UI

When stdout is a TTY and `--quiet` is not passed, hypertest renders a live terminal UI using [Ink](https://github.com/vadimdemedes/ink). The UI updates in place — no log spam, just the current state.

### Status icons

| Icon | Meaning |
|------|---------|
| `·` | Pending — not started yet |
| ⠸ _(spinner)_ | Running — in progress |
| `✓` | Done — completed successfully |
| `✕` | Failed — error occurred |
| `◯` | Skipped |
| `▲` | Warning |

### Deploy UI

Shows all five deploy steps. Steps execute sequentially; completed steps show their duration, failed steps show the error message inline.

```
hypertest.

DEPLOY
──────────────────────────────────────────────────────────────────

✓  pull base image                 2.3s
✓  build container image           18.4s
⠸  push image to cloud
·  build manifest
·  update lambda

elapsed 21.2s
```

On success the header shows `DEPLOY ✓ done`. On failure it shows `DEPLOY ✕ failed` and the failed step displays the error reason:

```
hypertest.

DEPLOY ✕ failed
──────────────────────────────────────────────────────────────────

✕  pull base image                 Docker daemon is not running. Please start Docker and try again.
·  build container image
·  push image to cloud
·  build manifest
·  update lambda

elapsed 0.4s
```

### Invoke UI

Shows a live running count, completed test rows as they arrive, and a summary once all tests finish.

```
hypertest.

RUN abc12345 · 14 tests · concurrency 30
──────────────────────────────────────────────────────────────────

  3 running
──────────────────────────────────────────────────────────────────
✓  auth.spec.ts › should login successfully           2.3s
✓  todo-app.spec.ts › should add todo items           3.1s
✕  filters.spec.ts › should respect the back button  1.8s
✓  dashboard.spec.ts › renders without errors         4.0s

──────────────────────────────────────────────────────────────────
✓ 12 passed  ✕ 2 failed  ◯ 0 skipped  ·  of 14

Results: ./hypertest.results.json
```

## Plain text (`--quiet` or non-TTY)

When `--quiet` is passed, or when stdout is not a TTY (CI runners, piped output), hypertest falls back to plain text — one line per event, no cursor tricks:

```
[deploy] pullBase starting
[deploy] pullBase done (2.3s)
[deploy] build starting
[deploy] build done (18.4s)
[deploy] push starting
...
[run:start] 14 tests · concurrency 30 · run abc12345
[test:end] ✓ auth.spec.ts › should login successfully (2.3s)
[test:end] ✕ filters.spec.ts › should respect the back button (1.8s)
[run:end] 14 tests · 12 passed · 0 skipped · 2 failed
```

Plain text mode is the right choice for CI pipelines where log output is captured and stored (GitHub Actions, GitLab CI, etc.). Add `--quiet` to your CI command or let hypertest detect the non-TTY environment automatically.

## Dev / demo mode

Set `HYPERTEST_DEV=true` to run a fully simulated deploy or invoke against mock data — no AWS credentials, Docker, or deployed infrastructure needed. Both the interactive UI and plain text output work in dev mode.

```bash
HYPERTEST_DEV=true npx hypertest invoke   # 14 mock tests with realistic durations
HYPERTEST_DEV=true npx hypertest deploy   # 5 animated deploy steps
```

Control animation speed with `HYPERTEST_DEV_SPEED` (default: `10`, higher = faster):

```bash
HYPERTEST_DEV_SPEED=3 HYPERTEST_DEV=true npx hypertest invoke   # slower, easier to follow
HYPERTEST_DEV_SPEED=50 HYPERTEST_DEV=true npx hypertest deploy  # near-instant
```
