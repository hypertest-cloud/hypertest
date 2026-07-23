# CLAUDE.md — hypertest-core

Package-specific guidance for `packages/hypertest-core`. Read the root `CLAUDE.md` first for monorepo-wide context.

## Commands

Run from `packages/hypertest-core/` or use `--workspace` from root:

```bash
npm test                                        # run all ~90 unit tests
npm run build                                   # compile TypeScript to dist/
npm run lint                                    # Biome lint + format check

# From repo root:
npm test --workspace=packages/hypertest-core
npm run build --workspace=packages/hypertest-core
```

## Package Structure

```
src/
├── cli.tsx                    # CLI entry point — parses flags, picks reporter, calls setupHypertest
├── index.ts                   # setupHypertest() — wires config + providers + events
├── events.ts                  # createEventBus() — typed in-memory pub/sub
├── logger.ts                  # createLogger() — Winston logger routed entirely to stderr
├── config.ts                  # loadConfig() — reads hypertest.config.js
├── dev/                       # Mock data for HYPERTEST_DEV=true mode
│   └── index.ts
└── ui/
    ├── theme.ts               # Colors and status glyphs (✓ ✕ ◯ ○ · ▲)
    ├── apps/
    │   ├── DeployApp.tsx      # Deploy view — step list with spinner + elapsed timer
    │   ├── InvokeApp.tsx      # Invoke view — completed rows + live running list + summary
    │   ├── DoctorApp.tsx      # Doctor view — check results
    │   └── InitApp.tsx        # Post-init confirmation
    ├── components/
    │   ├── TestRow.tsx        # Single test row (running or done)
    │   ├── InvokeSummary.tsx  # Run totals, failures, artifact/results paths
    │   ├── StepList.tsx       # Deploy steps with status + durations
    │   ├── DoctorCheck.tsx    # Single doctor check result
    │   └── StatusIcon.tsx     # Status glyph + spinner
    └── reporters/
        ├── inkReporter.ts     # Rich TUI via Ink — used when stdout is a TTY and --quiet not set
        ├── plainReporter.ts   # One line per event — used in CI / --quiet mode
        └── pickReporter.ts    # Selects inkReporter or plainReporter based on isTTY + --quiet
```

## Testing

Node's built-in test runner. Test files use `.test.ts` / `.test.tsx` extensions.

```
src/__tests__/
├── apps/              # InvokeApp, DeployApp, DoctorApp Ink component tests
├── components/        # TestRow, InvokeSummary, DoctorCheck, StepList, StatusIcon
├── reporters/         # plainReporter, pickReporter
├── events.test.ts
├── init.test.ts
├── parseTestResult.test.ts
└── theme.test.ts
```

Ink component tests use `ink-testing-library` (`render()` + `.lastFrame()`). Mock events by importing `createEventBus()` and emitting directly.

Test scripts use quoted glob patterns — required for Node 22 to expand `**` on all platforms:
```json
"test": "node --import tsx/esm --test --test-reporter=spec \"src/__tests__/**/*.test.ts\" \"src/__tests__/**/*.test.tsx\""
```

## Key Patterns

### Reporter lifecycle (`cli.tsx`)

```typescript
const reporter = pickReporter(opts, events);
let deployStarted = false;
try {
  const core = await setupHypertest({ dryRun: opts.dryRun, silent, events });
  deployStarted = true;   // Ink is now mounted and rendering
  await core.deploy();
} catch {
  if (!deployStarted) reporter.abort(); // safe — no events emitted yet
  process.exitCode = 1;
} finally {
  await reporter.done(); // always wait for Ink to finish rendering
}
```

`deployStarted` flag is critical: calling `reporter.abort()` after Ink mounts causes `unmount()` immediately, which resets Ink's line counter to 0 before the throttled render flushes — leaving a ghost frame. Only abort when `setupHypertest()` itself throws (before any events).

### Logger silencing (`index.ts`)

```typescript
const config: ResolvedHypertestConfig = { ...baseConfig, events: bus };
if (silent) config.logger.silent = true;
```

`silent` is `true` exactly when Ink is active. Winston's `.silent` property suppresses all output without changing transport config. This prevents stderr writes from corrupting Ink's cursor-position tracking (Ink only tracks stdout line counts).

### Two-stream architecture

| Stream | Interface | Purpose |
|--------|-----------|---------|
| Event bus | `HypertestEvents` | UI lifecycle signals — drives Ink and plain reporter |
| Logger | `config.logger` (Winston) | Operational/debug messages — goes to stderr, file, or remote |

Never use `config.logger` for signals the UI needs to react to. Never use the event bus for debug-level operational data.

### `setupHypertest()` signature

```typescript
setupHypertest({
  dryRun: boolean,
  silent: boolean,   // true = Ink active; silences logger
  events?: HypertestEvents,
}): Promise<{ deploy(): Promise<void>; invoke(): Promise<void> }>
```

### Dev mode

`HYPERTEST_DEV=true` swaps real providers for mocks in `src/dev/index.ts`. Emits identical events as real providers — the reporter layer is exercised identically. `HYPERTEST_DEV_SPEED` controls animation speed (default 10×).
