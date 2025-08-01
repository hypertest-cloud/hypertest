// biome-ignore lint/style/noDefaultExport: <explanation>
export default {
  title: 'hypertest',
  description:
    'Distributes tests in the cloud to cut runtime to just your slowest test.',
  lang: 'en-US',
  lastUpdated: true,

  themeConfig: {
    sidebar: [
      {
        text: 'Introduction',
        link: '/introduction',
        collapsed: false,
      },
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Installation', link: 'getting-started/installation' },
          { text: 'Configuration', link: 'getting-started/configuration' },
          { text: 'Usage', link: 'getting-started/usage' },
        ],
      },
      {
        text: 'Plugins',
        link: '/plugins',
        collapsed: true,
        items: [],
      },
      {
        text: 'Clouds',
        link: '/clouds',
        collapsed: true,
        items: [],
      },
      {
        text: 'Developers',
        collapsed: true,
        items: [{ text: 'Architecture', link: '/developers/architecture' }],
      },
      {
        text: 'Release notes',
        link: '/release-notes',
        collapsed: true,
        items: [],
      },
    ],
    editLink: {
      text: 'Edit this page on GitHub',
      pattern:
        'https://github.com/hypertest-cloud/hypertest/tree/main/packages/hypertest-docs/docs/:path',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hypertest-cloud/hypertest' },
    ],
  },
};
