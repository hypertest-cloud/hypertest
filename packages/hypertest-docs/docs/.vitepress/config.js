export default {
  // site-level options
  title: 'HT',
  description: 'Just playing around.',

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
  },
};
