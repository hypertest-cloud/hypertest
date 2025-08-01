export default {
  // site-level options
  title: 'hypertest',
  description: 'Just playing around.',
  lang: 'en-US',
  lastUpdated: true,

  themeConfig: {
    sidebar: [
      {
        text: 'Introduction',
        link: '/introduction',
      },
      {
        text: 'Getting Started',
        items: [
          { text: 'Installation', link: 'getting-started/installation' },
          { text: 'Configuration', link: 'getting-started/configuration' },
          { text: 'Using', link: 'getting-started/using' },
        ],
      },
      {
        text: 'Plugins',
        link: '/plugins',
        items: [],
      },
      {
        text: 'Clouds',
        link: '/clouds',
        items: [],
      },
      {
        text: 'Developers',
        items: [{ text: 'Architecture', link: '/developers/architecture' }],
      },
      {
        text: 'Release notes',
        link: '/release-notes',
        items: [],
      },
    ],
    editLink: {
      text: 'Edit this page on GitHub',
      pattern:
        'https://github.com/hypertest-cloud/hypertest/tree/main/packages/hypertest-docs/docs/:path',
    },
  },
};
