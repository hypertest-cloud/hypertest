# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start local dev server with hot reload
npm run build    # Build static site (outputs to docs/.vitepress/dist)
npm run preview  # Preview the built site locally
```

## Project Structure

VitePress documentation site for hypertest (cloud-based test distribution system). Part of monorepo at `packages/hypertest-docs`.

### Key Locations

- **VitePress config**: `docs/.vitepress/config.js` - Sidebar navigation and theme settings
- **Home page**: `docs/index.md` - Hero layout with features

### Content Organization

```
docs/
├── index.md                      # Home page (hero layout)
├── introduction.md               # Main intro and value proposition
├── getting-started/
│   ├── installation.md           # Package installation
│   ├── configuration.md          # Config file and AWS setup
│   └── usage.md                  # Deploy/invoke workflow
├── plugins/
│   ├── overview.md               # Plugin architecture
│   └── playwright.md             # Playwright plugin deep dive
├── clouds/
│   ├── overview.md               # Cloud provider architecture
│   └── aws.md                    # AWS provider deep dive
├── runners/
│   ├── overview.md               # Runner architecture
│   └── aws-playwright.md         # AWS Playwright runner deep dive
├── developers/
│   └── architecture.md           # System architecture
└── release-notes/
    └── 0.1.0.md                  # Version release notes
```

## Adding New Documentation

1. Create `.md` file in appropriate directory under `docs/`
2. Add frontmatter with `outline: deep` and `prev`/`next` navigation links
3. Update sidebar in `docs/.vitepress/config.js`

### Page Frontmatter

```yaml
---
outline: deep
prev:
  text: 'Previous Page'
  link: '/path/to/previous'
next:
  text: 'Next Page'
  link: '/path/to/next'
---
```

## Documentation Style

- Use `::: code-group` for npm/yarn/pnpm alternatives
- Use `::: tip` and `::: warning` for callouts
- Use tables for configuration options
- Use ASCII diagrams for architecture visualization
- Add links to external tools (Playwright, AWS Lambda, etc.)
- Keep consistent heading hierarchy (H1 for title, H2 for sections, H3 for subsections)

## Hypertest Concepts

When writing docs, reference these key concepts:
- **Two-phase workflow**: Deploy (build/push Docker image) → Invoke (run tests in Lambda)
- **Three component types**: Plugins (test framework), Clouds (infrastructure), Runners (execution)
- **Artifacts**: Tests use `HT_TEST_ARTIFACTS_OUTPUT_PATH` env var
- **Configuration**: `hypertest.config.js` with `defineConfig` helper
