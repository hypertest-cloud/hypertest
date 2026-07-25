---
outline: deep
prev:
  text: Architecture
  link: /developers/architecture
next:
  text: Manifest
  link: /developers/manifest
---

# Logging

hypertest has two separate output streams that serve different purposes and reach different consumers.

## Two streams

| Stream | Interface | Purpose | Consumer |
|--------|-----------|---------|----------|
| **Event bus** | `HypertestEvents` | Lifecycle signals (step started, test ended, …) | Ink TUI and plain-text reporter |
| **Logger** | `config.logger` (Winston) | Operational and debug messages | Configured Winston transports |

**Events** drive the terminal UI. When a deploy step finishes or a test completes, the core emits a typed event that the active reporter renders in real time. Events are intentionally narrow — they carry only what the UI needs.

**Logger** carries everything else: internal debug traces, retry messages, SDK responses, informational notes that would clutter the UI but are useful for troubleshooting. Because it is a full Winston instance, users can route it to a file, a remote sink, or any other transport without changing how the UI behaves.

## Using the logger in plugins and providers

Every plugin and provider receives `config`, which includes a `logger` property typed as `winston.Logger`. Use it directly:

```ts
// in a cloud provider or test runner plugin handler
async pullBaseImage() {
  config.logger.verbose('Logging in to ECR...');
  await runCommand(`docker login ...`);

  config.logger.verbose('Pulling base image...');
  await runCommand(`docker pull ${settings.baseImage}`);
}
```

### Log levels

Use levels consistently so users can filter noise:

| Level | When to use |
|-------|-------------|
| `error` | Something failed that the user must act on |
| `warn` | Unexpected but recoverable situation |
| `info` | High-level milestone (deploy started, results written) |
| `verbose` | Step-level detail (ECR auth, image tag, S3 upload) |
| `debug` | Low-level traces useful for debugging integrations |

::: tip
`config.logger.verbose(...)` maps to Winston's `verbose` level. Avoid `debug` for routine operational messages — reserve it for SDK payloads and raw responses.
:::

## Configuring the logger

The logger is initialized from `loggerOptions` in `hypertest.config.js`. Any valid [`winston.LoggerOptions`](https://github.com/winstonjs/winston#creating-your-own-logger) object is accepted:

```js
// hypertest.config.js
export default defineConfig({
  // ...
  loggerOptions: {
    level: 'verbose',                          // default: 'info'
    transports: [
      new winston.transports.Console(),        // stdout/stderr
      new winston.transports.File({            // also write to a file
        filename: 'hypertest.log',
        format: winston.format.json(),
      }),
    ],
  },
});
```

**Default behaviour** (when `loggerOptions` is omitted): a single Console transport writes JSON-formatted messages to stderr at `info` level.

## Behaviour during interactive runs

When hypertest renders the Ink TUI (TTY stdout, no `--quiet`), the logger is automatically silenced for the duration of the command. This prevents logger output on stderr from corrupting Ink's cursor-position tracking, which would cause the UI to render twice or flash raw log lines.

In non-TTY environments (`--quiet`, CI pipelines, piped output) the logger writes normally to whatever transports are configured.

```
TTY + no --quiet  →  logger.silent = true   (Ink handles all user-facing output)
--quiet or non-TTY →  logger writes normally via configured transports
```
