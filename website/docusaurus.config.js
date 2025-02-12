// @ts-check

const config = {
  title: 'Ingest',
  tagline: 'A powerful data ingestion framework',
  url: 'https://msu-wone.github.io',
  baseUrl: '/ingest/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'msu-wone',
  projectName: 'ingest',

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/msu-wone/ingest/tree/main/website/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Ingest',
      logo: {
        alt: 'Ingest Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'doc',
          docId: 'intro',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/msu-wone/ingest',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/getting-started',
            },
            {
              label: 'API Reference',
              to: '/docs/api-reference',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/msu-wone/ingest',
            },
          ],
        },
      ],
      copyright: `Copyright ${new Date().getFullYear()} 
      msu-wone. Built with Docusaurus.`,
    },
    prism: {
      theme: {
        plain: {
          color: "#393A34",
          backgroundColor: "#f6f8fa"
        },
        styles: []
      },
      darkTheme: {
        plain: {
          color: "#F8F8F2",
          backgroundColor: "#282A36"
        },
        styles: []
      }
    },
  },
};

module.exports = config;