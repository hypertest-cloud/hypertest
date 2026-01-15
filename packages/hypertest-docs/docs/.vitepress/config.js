// biome-ignore lint/style/noDefaultExport: <explanation>
export default {
  title: 'hypertest',
  description:
    'Distributes tests in the cloud to cut runtime to just your slowest test.',
  lang: 'en-US',
  lastUpdated: true,

  themeConfig: {
    search: {
      provider: 'local',
    },
    sidebar: [
      {
        text: 'Getting Started',
        collapsed: false,
        items: [
          { text: 'Installation', link: '/getting-started/installation' },
          { text: 'Configuration', link: '/getting-started/configuration' },
          { text: 'Usage', link: '/getting-started/usage' },
        ],
      },
      {
        text: 'Plugins',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/plugins/overview' },
          { text: 'Playwright', link: '/plugins/playwright' },
        ],
      },
      {
        text: 'Clouds',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/clouds/overview' },
          { text: 'AWS', link: '/clouds/aws' },
        ],
      },
      {
        text: 'Runners',
        collapsed: true,
        items: [
          { text: 'Overview', link: '/runners/overview' },
          { text: 'AWS Playwright', link: '/runners/aws-playwright' },
        ],
      },
      {
        text: 'Developers',
        collapsed: true,
        items: [{ text: 'Architecture', link: '/developers/architecture' }],
      },
      {
        text: 'Release notes',
        collapsed: true,
        items: [{ text: 'Version 0.1.0', link: '/release-notes/0.1.0' }],
      },
    ],
    editLink: {
      text: 'Edit this page on GitHub',
      pattern:
        'https://github.com/hypertest-cloud/hypertest/tree/main/packages/hypertest-docs/docs/:path',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hypertest-cloud/hypertest' },
      { icon: 'discord', link: 'https://discord.gg/Ud9E86JCM3' },
    ],
  },
};
