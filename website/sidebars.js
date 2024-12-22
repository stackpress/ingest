/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/installation', 'getting-started/quick-start'],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      items: ['core-concepts/overview'],
    },
    {
      type: 'category',
      label: 'Features',
      items: ['features/entries', 'features/fetch', 'features/http', 
            'features/plugins'],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: ['api/core-api'],
    },
    {
      type: 'category',
      label: 'Examples',
      items: ['examples/with-entries', 'examples/with-fetch', 
             'examples/with-http', 'examples/with-plugins'],
    },
    'contributing',
  ],
};

module.exports = sidebars;
