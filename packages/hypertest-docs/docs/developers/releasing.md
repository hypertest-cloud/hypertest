---
outline: deep
prev:
  text: Node.js Version Upgrade
  link: /developers/node-version-upgrade
next:
  text: License Overview
  link: /license/overview
---

# Releasing

hypertest uses [Changesets](https://github.com/changesets/changesets) to manage versioning and npm publishing across the monorepo. This document covers how to record a change, how the release automation works, and how to bootstrap the very first publish.

## Published packages

| Package | npm name |
|---------|----------|
| `packages/hypertest-core` | `@hypertest-cloud/core` |
| `packages/hypertest-types` | `@hypertest-cloud/types` |
| `packages/hypertest-plugin-playwright` | `@hypertest-cloud/plugin-playwright` |
| `packages/hypertest-provider-cloud-aws` | `@hypertest-cloud/provider-cloud-aws` |
| `packages/hypertest-runner-aws-playwright` | `@hypertest-cloud/runner-aws-playwright` |

The following packages are **not published** (private or internal):

| Package | Reason |
|---------|--------|
| `packages/hypertest-docs` | Documentation site only |
| `packages/hypertest-playground` | Local dev reference project |
| `packages/internal-hypertest-playwright-container` | Internal Docker build artifact |

## Recording a change

Every user-facing change that should appear in a changelog and trigger a version bump needs a changeset file. Run this from the repo root **before opening a PR**:

```bash
npx changeset
```

The interactive prompt will ask:

1. **Which packages changed?** — select all packages affected by your change.
2. **What kind of change?** — `patch` for bug fixes, `minor` for new features, `major` for breaking changes.
3. **Summary** — one sentence describing the change (this becomes the changelog entry).

This creates a `.changeset/<random-name>.md` file. Commit it with your PR.

::: tip Semver guide
- `patch` — backwards-compatible bug fix (e.g. crash fix, wrong output)
- `minor` — new backwards-compatible capability (e.g. new config option, new CLI flag)
- `major` — breaking change (e.g. renamed export, removed option, changed config shape)
:::

## Release flow

Releasing is fully automated once a changeset is merged to `main`.

### How it works

```
PR with changeset merged to main
        ↓
changesets/action opens "Version Packages" PR
(bumps versions + writes CHANGELOGs)
        ↓
You review and merge the Version Packages PR
        ↓
changesets/action publishes to npm
        ↓
Discord notification sent
```

The `release.yml` workflow runs on every push to `main`. It uses [`changesets/action`](https://github.com/changesets/action) which does one of two things depending on state:

- **Pending changesets exist** → opens or updates a "Version Packages" PR that bumps `version` fields and writes `CHANGELOG.md` entries. No publish happens yet.
- **Version Packages PR is merged** → publishes all bumped packages to npm and sends the Discord notification.

### Required secrets

| Secret | Purpose |
|--------|---------|
| `NPM_TOKEN` | Authenticates `npm publish` — must have write access to the `@hypertest-cloud` scope |
| `DISCORD_WEBHOOK` | Webhook URL for release notifications |
| `GITHUB_TOKEN` | Provided automatically by GitHub Actions — no setup needed |

## First publish (bootstrap)

Because these packages have never been published to npm, `changeset publish` will fail on the first run — the `@hypertest-cloud` scope does not yet exist on the registry.

Steps to bootstrap:

1. **Create the scope** — log in to npmjs.com and create the `@hypertest-cloud` organisation (or verify it already exists).

2. **Build locally**:
   ```bash
   npm run build
   ```

3. **Publish manually** — from the repo root with `NPM_TOKEN` set:
   ```bash
   NPM_TOKEN=<your-token> npx changeset publish
   ```
   This publishes every non-private package at their current version.

4. **Tag the release** — changesets/action expects git tags to track what's already published. After the manual publish, push the tags it created:
   ```bash
   git push --follow-tags
   ```

After this one-time bootstrap, all future releases go through the automated flow.

## Troubleshooting

**`changeset publish` fails with "package not found" or auth error**
→ Verify `NPM_TOKEN` is set in GitHub Actions secrets and has write permission to `@hypertest-cloud`.

**Version Packages PR keeps reopening after merge**
→ The workflow checkout needs `fetch-depth: 0` so changesets can read existing git tags. This is already set in `release.yml` — if you see this, check the workflow file.

**A package got published that shouldn't have**
→ Mark it `"private": true` in its `package.json`. Private packages are always skipped by `changeset publish`, regardless of the ignore list in `.changeset/config.json`.

**A package was accidentally omitted from a release**
→ Run `npx changeset` locally, add the missing package and a `patch` bump, then open a new PR. The next Version Packages cycle will include it.
