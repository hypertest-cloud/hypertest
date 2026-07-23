---
outline: deep
prev:
  text: Results
  link: /getting-started/results
next:
  text: Terminal output
  link: /getting-started/terminal-ui
---

# CLI Reference

Complete reference for all `hypertest` commands and flags.

## Commands

### `hypertest init`

Interactively generate a `hypertest.config.js` file in the current directory.

```bash
npx hypertest init
```

Prompts for (all have sensible defaults):
- **Concurrency** — parallel Lambda invocations (default: 30)
- **Image name** — Docker image identifier used in ECR (e.g. `my-app/hypertest-playwright`)
- **Local image name** — tag used when building locally (default: `hypertest-playwright`)
- **Local base image name** — tag for the pulled base image (default: `hypertest-playwright-base`)
- **Test runner** — currently only `playwright`
- **AWS region** — e.g. `eu-central-1`
- **ECR registry URL** — your account's ECR hostname
- **Base image** — full URI of the pre-built hypertest base image in ECR
- **Lambda function name** — the function hypertest will invoke
- **S3 bucket name** — bucket for test artifacts and results

When stdin is not a TTY (e.g. piped input), `init` skips all prompts and writes a config with the above defaults.

| Flag | Description |
|------|-------------|
| `--quiet` | Plain text output instead of interactive UI |

---

### `hypertest deploy`

Build your test container, push it to ECR, and update the Lambda function.

```bash
npx hypertest deploy [options]
```

Steps performed:
1. Pull base image from ECR
2. Build Docker image with your tests
3. Push image to ECR
4. Write manifest to cloud storage
5. Update Lambda function image

| Flag | Description |
|------|-------------|
| `--dry-run` | Simulate the deploy without executing any steps |
| `--quiet` | Plain text output; no interactive UI (use in CI) |

---

### `hypertest invoke`

Run your tests in parallel across cloud functions and collect results.

```bash
npx hypertest invoke [options]
```

Steps performed:
1. Pull manifest from cloud storage
2. Hash local test directory and compare with manifest (drift detection)
3. Invoke Lambda functions in parallel (up to `concurrency` limit)
4. Write `hypertest.results.json` locally and upload to cloud storage

| Flag | Description |
|------|-------------|
| `--dry-run` | Simulate the invoke without calling Lambda |
| `--quiet` | Plain text output; no interactive UI (use in CI) |

---

### `hypertest doctor`

Validate your configuration and cloud provider setup.

```bash
npx hypertest doctor [options]
```

Checks performed:
- `hypertest.config.js` exists and is valid
- AWS credentials are set
- Lambda concurrency quota is sufficient for configured `concurrency`

| Flag | Description |
|------|-------------|
| `--quiet` | Plain text output; no interactive UI |

---

## Output modes

### Interactive UI (default)

When stdout is a TTY, hypertest renders a live terminal UI using Ink. The deploy UI shows each step with a spinner, elapsed time, and success/error status. The invoke UI shows each test as it completes.

### Plain text (`--quiet` or non-TTY)

When `--quiet` is passed, or when stdout is not a TTY (CI runners, piped output), hypertest falls back to plain text output — one line per event:

```
[deploy] pullBase starting
[deploy] pullBase done (2.1s)
[deploy] build starting
...
[run:start] 14 tests · concurrency 5 · run abc12345
[test:end] ✓ todo-app.spec.ts › should add todo items
[test:end] ✕ filters.spec.ts › should respect the back button
[run:end] 14 tests · 12 passed · 0 skipped · 2 failed
```

## Exit codes

| Code | Meaning |
|------|---------|
| `0` | All tests passed (invoke), or operation completed successfully (deploy, doctor, init) |
| `1` | One or more tests failed, or a command error occurred (config missing, AWS error, etc.) |
