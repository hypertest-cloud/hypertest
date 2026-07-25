---
outline: deep
prev:
  text: Node.js Version Upgrade
  link: /developers/node-version-upgrade
next:
  text: License overview
  link: /license/overview
---

# Dev Mode

Dev mode lets you run the hypertest CLI with simulated data — no cloud credentials, Docker, or deployed infrastructure needed. It's useful for developing the terminal UI or exploring the CLI without a real cloud setup.

## Enabling dev mode

Set the `HYPERTEST_DEV` environment variable to `true` before any hypertest command:

```bash
HYPERTEST_DEV=true npx hypertest invoke
HYPERTEST_DEV=true npx hypertest deploy
```

When active, hypertest replaces all cloud calls with mock implementations:

- `invoke` — simulates a run with 14 fake tests, randomised pass/fail outcomes
- `deploy` — simulates each deploy step (pull, build, push, manifest, update) with artificial delays

No cloud credentials, ECR, Lambda, or S3 are contacted.

## Controlling animation speed

By default, simulated operations run at 10× speed so you can see the full UI flow quickly. Use `HYPERTEST_DEV_SPEED` to slow it down:

```bash
HYPERTEST_DEV=true HYPERTEST_DEV_SPEED=2 npx hypertest invoke
```

| Variable | Default | Description |
|----------|---------|-------------|
| `HYPERTEST_DEV` | — | Set to `true` to enable dev mode |
| `HYPERTEST_DEV_SPEED` | `10` | Speed multiplier — lower values slow the simulation down |

::: tip
Set `HYPERTEST_DEV_SPEED=1` to see the UI at real-world speed, which is useful for recording demos or checking timing behaviour.
:::
