---
outline: deep
prev:
  text: 'Manifest'
  link: '/developers/manifest'
next:
  text: 'License Overview'
  link: '/license/overview'
---

# Node.js Version Upgrade

This guide explains how to bump the Node.js runtime version used by hypertest Lambdas. Node.js follows a predictable LTS lifecycle, so this process repeats roughly every two years as older LTS lines reach end-of-life.

## When to upgrade

Node.js releases follow a fixed schedule:

- **Active LTS** — the recommended target for production use
- **Maintenance LTS** — security fixes only, approaching end-of-life
- **End-of-life (EOL)** — no further patches; AWS deprecates the corresponding managed runtime on a multi-month delay

Upgrade when the current runtime enters **Maintenance LTS**, targeting the current **Active LTS** line. Check the schedule at [nodejs.org/en/about/previous-releases](https://nodejs.org/en/about/previous-releases).

Before upgrading, verify that AWS has a GA managed runtime for the target version (`nodejsXX.x`). hypertest uses **container image Lambdas**, so the managed runtime string is not set in code — the Node version is determined entirely by the `FROM` line in the `Dockerfile` runtime stage. However, AWS must have published a `node:XX-bookworm` base image and the corresponding Lambda RIC must support the target version.

## Where Node version is pinned

| File | Location | Update required | Notes |
|------|----------|:--------------:|-------|
| `Dockerfile` | `FROM node:XX-bookworm` (~line 29) | Yes | **Functional** — determines the actual Lambda runtime |
| `README.md` | Prerequisites section | Yes | Docs only |
| `packages/hypertest-docs/docs/getting-started/installation.md` | Prerequisites list | Yes | Docs only |
| `packages/hypertest-docs/docs/getting-started/usage.md` | Example CI workflow `node-version` | Yes | Docs only |
| `Dockerfile` | `ARG BASE_ALPINE_IMAGE=node:XX-alpine` (line 1) | No | Build stage — update separately if needed |
| `.github/workflows/ci.yml` | `node-version` | No | CI runner — update separately if needed |
| `.github/workflows/playground-image-dev.yml` | `node-version` | No | CI runner — update separately if needed |
| `.github/workflows/docs-dev.yml` | `node-version` | No | CI runner — update separately if needed |
| `packages/hypertest-runner-aws-playwright/package.json` | `@types/node` | No | Type definitions — update separately if needed |

## Step-by-step process

### 1. Update the Dockerfile runtime stage

```diff
- FROM node:20-bookworm
+ FROM node:22-bookworm
```

Keep the `bookworm` (Debian 12) tag. Do not switch to `bookworm-slim` or `alpine` — the runtime stage relies on Debian apt packages for native module builds and Playwright runtime dependencies.

### 2. Update user-facing docs

- `README.md` — Prerequisites section
- `packages/hypertest-docs/docs/getting-started/installation.md` — Node version prerequisite
- `packages/hypertest-docs/docs/getting-started/usage.md` — Example CI workflow `node-version`

### 3. Sanity-check for stragglers

```bash
# Should return zero matches outside package-lock.json
rg -n "node[:-]?20|nodejs20|version 20" --glob '!package-lock.json' --glob '!CHANGELOG*'
```

`package-lock.json` contains `"node": ">=20.0.0"` engine constraints from AWS SDK packages — these are minimum-version lower bounds, satisfied by any higher Node version, and must not be edited.

## Verification

### Local container smoke test

```bash
# Build the workspace and Docker image
npm ci && npm run build && npm run docker

# Confirm the runtime layer is on the new Node version
docker run --rm --entrypoint node hypertest-playwright --version
# expected: vXX.x.x

# Confirm the npx-cli.js entrypoint path still exists in the new base image
docker run --rm node:XX-bookworm ls /usr/local/lib/node_modules/npm/bin/npx-cli.js
# If the path moved, update the ENTRYPOINT in the Dockerfile runtime stage
```

### CI workflows

Push the branch and trigger the base-image workflow manually — the `Dockerfile` lives at the repo root, outside the `packages/hypertest-runner-aws-playwright/**` path filter that auto-triggers the workflow:

```bash
gh workflow run runner-aws-playwright-base-image-dev.yml --ref <your-branch>
```

Verify both jobs pass:
1. **Build and push base image to dev ECR** — new Node image pushed
2. **Trigger playground deployment / Build and deploy playground image to dev** — playground Lambda updated

### End-to-end invoke

```bash
cd packages/hypertest-playground
npx hypertest invoke
```

Check `hypertest.results.json`:
- `tests.total` matches the test count in `playwright/tests/`
- Only `failing.spec.ts` contributes failures; all other specs pass
- No `was compiled against a different Node.js version` errors in CloudWatch logs

## Rollback

The only functional change is one Docker layer. To roll back:

1. Revert `Dockerfile` line ~29 to the previous `node:XX-bookworm` tag
2. Re-run the base-image workflow
3. If immediate rollback is needed before CI finishes, point the Lambda directly at the previous ECR image by SHA:

```bash
aws lambda update-function-code \
  --function-name hypertest-playground-playwright \
  --image-uri <previous-sha-uri>
```

The previous image remains tagged in ECR by SHA and is not garbage-collected automatically.
