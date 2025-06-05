import { defineConfig } from 'vitepress';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'HT',
  description:
    'Revolutionize your testing with our plug-and-play TypeScript library. Effortlessly integrates, distributing tests in the cloud to cut runtime to just your slowest test. Exceptionally affordable for fast, cost-effective development.',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Examples', link: '/markdown-examples' },
    ],

    sidebar: [
      {
        text: 'Examples',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/hypertest-cloud/hypertest' },
    ],
  },
});
