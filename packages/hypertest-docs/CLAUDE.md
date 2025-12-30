# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start local dev server with hot reload
npm run dev

# Build static site for production (outputs to docs/.vitepress/dist)
npm run build

# Preview the built site locally
npm run preview
```

## Project Structure

This is a VitePress documentation site for Hypertest - a cloud-based test distribution system. The site is part of a larger monorepo at `packages/hypertest-docs`.

### Key Locations

- **VitePress config**: `docs/.vitepress/config.js` - Site configuration, sidebar navigation, theme settings
- **Home page**: `docs/index.md` - Hero layout with features
- **Documentation pages**: `docs/*.md` and subdirectories
- **Assets**: `docs/developers/intrastracture-graph.png` (architecture diagram)

### Content Organization

```
docs/
├── index.md                    # Home page (hero layout)
├── introduction.md             # Main intro and value proposition
├── plugins.md                  # Placeholder
├── clouds.md                   # Placeholder
├── release-notes.md            # Placeholder
├── getting-started/
│   ├── installation.md         # Package installation guide
│   ├── configuration.md        # Config file and AWS setup
│   └── usage.md                # Deploy/invoke workflow
└── developers/
    ├── architecture.md         # System architecture docs
    └── intrastracture-graph.png
```

## Adding New Documentation

1. Create a new `.md` file in the appropriate directory under `docs/`
2. Add frontmatter with `outline: deep` for automatic table of contents
3. Update the sidebar in `docs/.vitepress/config.js` to include the new page
4. Add `prev`/`next` links in frontmatter for navigation flow

### Page Frontmatter Example

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

## VitePress Features Used

- **Code groups**: Show npm/yarn/pnpm alternatives with `::: code-group`
- **Hero layout**: Home page uses `layout: home` with features
- **Edit links**: Configured to link to GitHub repo
- **Last updated**: Timestamps enabled globally

## Code Style

The monorepo uses Biome for linting/formatting (config in root `biome.json`):
- 2-space indentation
- Single quotes for JavaScript
- No semicolons required by default

## Context: Hypertest Documentation

When writing documentation, reference these key Hypertest concepts:
- **Two-phase workflow**: Deploy (build/push Docker image) → Invoke (run tests in Lambda)
- **Plugin architecture**: TestRunnerPlugin (Playwright) + CloudFunctionProviderPlugin (AWS)
- **Artifacts**: Tests use `HT_TEST_ARTIFACTS_OUTPUT_PATH` env var to save screenshots/videos
- **Configuration**: Users create `hypertest.config.js` with `defineConfig` helper
