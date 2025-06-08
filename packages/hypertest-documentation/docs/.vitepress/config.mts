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
      { text: 'TODO', link: '/todo' },
    ],

    sidebar: [
      {
        text: 'Section todo',
        items: [
          { text: 'Todo', link: '/todo' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/hypertest-cloud/hypertest' },
    ],
  },
});
