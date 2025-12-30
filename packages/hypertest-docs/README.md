# @hypertest/hypertest-docs

VitePress documentation site for Hypertest - a cloud-based test distribution system.

## Development

```bash
# Start local dev server with hot reload
npm run dev

# Build static site (outputs to docs/.vitepress/dist)
npm run build

# Preview the built site locally
npm run preview
```

## Structure

```
docs/
├── index.md                  # Home page (hero layout)
├── introduction.md           # Value proposition and overview
├── getting-started/          # Installation, configuration, usage
├── plugins/                  # Test framework plugins (Playwright)
├── clouds/                   # Cloud providers (AWS)
├── runners/                  # Lambda runners (AWS Playwright)
├── developers/               # Architecture documentation
└── release-notes/            # Version history
```

## Adding Pages

1. Create `.md` file in appropriate `docs/` subdirectory
2. Add page to sidebar in `docs/.vitepress/config.js`
3. Add frontmatter for navigation:

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
