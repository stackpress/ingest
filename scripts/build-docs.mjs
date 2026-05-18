import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import render from '@stackpress/lib/Template';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const specsDir = path.join(root, 'specs');
const docsDir = path.join(root, 'docs');
const templatesDir = path.join(__dirname, 'templates');
const fragmentsDir = path.join(templatesDir, 'fragments');
const repoUrl = 'https://github.com/stackpress/ingest';

const site = {
  title: 'Ingest',
  tagline: 'Composable Server/less IO Framework',
  repoUrl
};
let templates = {};

const sectionOrder = [
  ['root', 'Overview'],
  ['concepts', 'Concepts'],
  ['guides', 'Guides'],
  ['api', 'API Reference']
];

const pageDefinitions = [
  { source: 'README.md', output: 'index.html', section: 'root', label: 'Home' },
  { source: 'overview.md', output: 'overview.html', section: 'root', label: 'Overview' },
  { source: 'examples.md', output: 'examples.html', section: 'root', label: 'Examples' },
  { source: 'plugin-development.md', output: 'plugin-development.html', section: 'root', label: 'Plugin Development' },
  { source: 'concepts/README.md', output: 'concepts/index.html', section: 'concepts', label: 'Concepts' },
  { source: 'concepts/application-model.md', output: 'concepts/application-model.html', section: 'concepts', label: 'Application Model' },
  { source: 'concepts/data-surfaces.md', output: 'concepts/data-surfaces.html', section: 'concepts', label: 'Data Surfaces' },
  { source: 'concepts/request-lifecycle.md', output: 'concepts/request-lifecycle.html', section: 'concepts', label: 'Request Lifecycle' },
  { source: 'concepts/composition.md', output: 'concepts/composition.html', section: 'concepts', label: 'Composition' },
  { source: 'concepts/routing-patterns.md', output: 'concepts/routing-patterns.html', section: 'concepts', label: 'Routing Patterns' },
  { source: 'concepts/runtimes-and-tooling.md', output: 'concepts/runtimes-and-tooling.html', section: 'concepts', label: 'Runtimes and Tooling' },
  { source: 'guides/README.md', output: 'guides/index.html', section: 'guides', label: 'Guides' },
  { source: 'guides/create-a-server.md', output: 'guides/create-a-server.html', section: 'guides', label: 'Create a Server' },
  { source: 'guides/use-decorators.md', output: 'guides/use-decorators.html', section: 'guides', label: 'Use Decorators' },
  { source: 'guides/add-a-plugin.md', output: 'guides/add-a-plugin.html', section: 'guides', label: 'Add a Plugin' },
  { source: 'guides/lazy-load-routes.md', output: 'guides/lazy-load-routes.html', section: 'guides', label: 'Lazy Load Routes' },
  { source: 'guides/render-views.md', output: 'guides/render-views.html', section: 'guides', label: 'Render Views' },
  { source: 'guides/deploy.md', output: 'guides/deploy.html', section: 'guides', label: 'Deploy an App' },
  { source: 'api/README.md', output: 'api/index.html', section: 'api', label: 'API Reference' },
  { source: 'api/Decorators.md', output: 'api/Decorators.html', section: 'api', label: 'Decorators' },
  { source: 'api/Server.md', output: 'api/Server.html', section: 'api', label: 'Server' },
  { source: 'api/Router.md', output: 'api/Router.html', section: 'api', label: 'Router' },
  { source: 'api/Route.md', output: 'api/Route.html', section: 'api', label: 'Route' },
  { source: 'api/Request.md', output: 'api/Request.html', section: 'api', label: 'Request' },
  { source: 'api/Response.md', output: 'api/Response.html', section: 'api', label: 'Response' },
  { source: 'api/Exception.md', output: 'api/Exception.html', section: 'api', label: 'Exception' },
  { source: 'api/ActionRouter.md', output: 'api/ActionRouter.html', section: 'api', label: 'ActionRouter' },
  { source: 'api/EntryRouter.md', output: 'api/EntryRouter.html', section: 'api', label: 'EntryRouter' },
  { source: 'api/ImportRouter.md', output: 'api/ImportRouter.html', section: 'api', label: 'ImportRouter' },
  { source: 'api/ViewRouter.md', output: 'api/ViewRouter.html', section: 'api', label: 'ViewRouter' },
  { source: 'api/HttpAdapter.md', output: 'api/HttpAdapter.html', section: 'api', label: 'HttpAdapter' },
  { source: 'api/WhatwgAdapter.md', output: 'api/WhatwgAdapter.html', section: 'api', label: 'WhatwgAdapter' },
  { source: 'api/Loader.md', output: 'api/Loader.html', section: 'api', label: 'Loader' },
  { source: 'api/Nest.md', output: 'api/Nest.html', section: 'api', label: 'Nest' },
  { source: 'api/ExpressEmitter.md', output: 'api/ExpressEmitter.html', section: 'api', label: 'ExpressEmitter' }
];

const pageMap = new Map(
  pageDefinitions.map(definition => [definition.source, definition.output])
);

async function main() {
  templates = await loadTemplates();

  for (const definition of pageDefinitions) {
    const sourcePath = path.join(specsDir, definition.source);
    const outputPath = path.join(docsDir, definition.output);
    const markdown = await fs.readFile(sourcePath, 'utf8');
    const page = await buildPage(definition, markdown);
    const html = renderPage(definition, page);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, html);
  }
}

async function loadTemplates() {
  const names = [
    'nav-group',
    'toc',
    'chip-row',
    'hero-actions',
    'home-hero-visual',
    'home-reading-path',
    'home-start-here'
  ];

  const entries = await Promise.all(
    names.map(async name => [
      templateKey(name),
      await fs.readFile(path.join(fragmentsDir, `${name}.html`), 'utf8')
    ])
  );

  return {
    home: await fs.readFile(path.join(templatesDir, 'home.html'), 'utf8'),
    layout: await fs.readFile(path.join(templatesDir, 'layout.html'), 'utf8'),
    ...Object.fromEntries(entries)
  };
}

function renderPage(definition, page) {
  if (definition.source === 'README.md') {
    return render(templates.home, { site, page });
  }

  return render(templates.layout, {
    site,
    page,
    navigation: renderNavigation(definition.output),
    toc: renderToc(page.toc),
    content: page.content
  });
}

async function buildPage(definition, markdown) {
  if (definition.source === 'README.md') {
    return buildHomePage(definition, markdown);
  }

  const { title, description, body } = parseMarkdownSource(markdown);
  const pageTitle = title;
  const outputPath = definition.output;
  const outputDir = path.posix.dirname(outputPath);
  const depth = outputDir === '.' ? 0 : outputDir.split('/').length;
  const assetRoot = `${'../'.repeat(depth)}assets`.replace(/\/$/, '');
  const homeHref = `${'../'.repeat(depth)}index.html`.replace(/^\.\//, '');
  const html = renderMarkdown(body, definition.source);
  const meta = definition.section === 'api'
    ? renderChipRow(['Class Reference', 'Methods, Properties, Examples'])
    : definition.section === 'guides'
      ? renderChipRow(['Task Guide', 'Implementation Steps'])
      : renderChipRow(['Concept', 'Framework Behavior']);

  return {
    title: pageTitle,
    description: description || `Documentation page for ${pageTitle}.`,
    navLabel: definition.section === 'api' ? 'Reference Map' : definition.section === 'guides' ? 'Build Map' : 'Reading Path',
    sectionLabel: definition.section === 'root'
      ? 'Foundation'
      : definition.section === 'api'
        ? 'Reference Layer'
        : definition.section === 'guides'
          ? 'Build Sequence'
          : 'System Model',
    meta,
    heroActions: '',
    assetRoot,
    homeHref,
    toc: html.toc,
    mainContent: wrapDocContent(html.content)
  };
}

async function buildHomePage(definition, markdown) {
  const outputPath = definition.output;
  const outputDir = path.posix.dirname(outputPath);
  const depth = outputDir === '.' ? 0 : outputDir.split('/').length;
  const assetRoot = `${'../'.repeat(depth)}assets`.replace(/\/$/, '');
  const homeHref = `${'../'.repeat(depth)}index.html`.replace(/^\.\//, '');
  const overviewMarkdown = await fs.readFile(path.join(specsDir, 'overview.md'), 'utf8');
  const overview = parseMarkdownSource(overviewMarkdown);
  const emphasis = extractListSection(overviewMarkdown, '## What Ingest emphasizes');
  const readmePath = extractOrderedList(markdown, '## Start here');
  const starterCode = {
    language: 'typescript',
    code: await fs.readFile(path.join(fragmentsDir, 'home-example.js'), 'utf8')
  };

  const sectionCards = [
    {
      title: 'Concepts',
      href: 'concepts/index.html',
      description: 'Application model, lifecycle, composition, routing patterns, and runtime boundaries.'
    },
    {
      title: 'Guides',
      href: 'guides/index.html',
      description: 'Task-focused docs for creating a server, adding plugins, rendering views, and deploying.'
    },
    {
      title: 'API Reference',
      href: 'api/index.html',
      description: 'Exact lookup pages for classes, adapters, routing helpers, and underlying primitives.'
    }
  ];

  return {
    description: 'A server/less framework built around event-driven routing, composability, and runtime portability.',
    navLabel: 'Explore Docs',
    meta: renderChipRow([
      '# plugin pattern for composability',
      '# native http & whatwg',
      '# server & serverless first',
      '# buildtime & runtime portability'
    ]),
    heroActions: render(templates.heroActions, {
      primaryHref: 'guides/create-a-server.html',
      primaryLabel: 'Create a Server',
      primaryTitle: 'Read the guide for creating an Ingest server',
      secondaryHref: 'concepts/application-model.html',
      secondaryLabel: 'Learn the Model',
      secondaryTitle: 'Read the application model concept page'
    }),
    assetRoot,
    homeHref,
    heroVisual: render(templates.homeHeroVisual, {
      codeBlock: renderCodeBlock(starterCode.code, starterCode.language)
    }),
    toc: [],
    mainContent: [
      render(templates.homeStartHere, {
        items: sectionCards
          .map(card => ({
            href: escapeAttribute(card.href),
            title: escapeHtml(card.title),
            description: escapeHtml(card.description)
          }))
      }),
      render(templates.homeReadingPath, {
        items: readmePath
          .map(item => ({
            content: renderInline(item, 'README.md')
          }))
      })
    ].join('\n'),
    footer: 'The homepage is assembled from the repository specs so the landing copy stays aligned with the actual documentation.'
  };
}

function parseMarkdownSource(markdown) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const titleLine = lines.find(line => line.startsWith('# ')) || '# Untitled';
  const title = titleLine.replace(/^# /, '').trim();
  const start = lines.indexOf(titleLine) + 1;
  let description = '';

  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      continue;
    }
    if (line.startsWith('## ') || line.startsWith('```')) {
      break;
    }
    description = line.replace(/`([^`]+)`/g, '$1');
    break;
  }

  return {
    title,
    description,
    body: markdown
  };
}

function renderNavigation(currentOutput) {
  return sectionOrder.map(([section, title]) => {
    const items = pageDefinitions
      .filter(definition => definition.section === section)
      .map(definition => ({
        label: escapeHtml(definition.label),
        href: escapeAttribute(relativeHref(currentOutput, definition.output)),
        title: escapeHtml(definition.label),
        className: definition.output === currentOutput ? 'is-active' : ''
      }));

    return render(templates.navGroup, { title, items });
  }).join('\n');
}

function renderToc(items) {
  if (!items.length) {
    return '';
  }
  return render(templates.toc, { items });
}

function renderMarkdown(markdown, sourcePath) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  if (lines[0]?.startsWith('# ')) {
    lines.shift();
  }
  const html = [];
  const toc = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const block = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        block.push(lines[index]);
        index += 1;
      }
      index += 1;
      html.push(renderCodeBlock(block.join('\n'), language || 'text'));
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      const level = line.match(/^#+/)[0].length;
      const text = line.replace(/^#{1,6}\s/, '').trim();
      const id = slugify(text);
      if (level >= 2 && level <= 3) {
        toc.push({ id, text });
      }
      html.push(`<h${level} id="${id}">${renderInline(text, sourcePath)}</h${level}>`);
      index += 1;
      continue;
    }

    if (line.startsWith('|')) {
      const tableLines = [];
      while (index < lines.length && lines[index].startsWith('|')) {
        tableLines.push(lines[index]);
        index += 1;
      }
      html.push(renderTable(tableLines, sourcePath));
      continue;
    }

    if (/^\s*\d+\.\s/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*\d+\.\s/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*\d+\.\s/, '').trim());
        index += 1;
      }
      html.push(`<ol>${items.map(item => `<li>${renderInline(item, sourcePath)}</li>`).join('')}</ol>`);
      continue;
    }

    if (/^\s*-\s/.test(line)) {
      const items = [];
      while (index < lines.length && /^\s*-\s/.test(lines[index])) {
        items.push(lines[index].replace(/^\s*-\s/, '').trim());
        index += 1;
      }
      html.push(`<ul>${items.map(item => `<li>${renderInline(item, sourcePath)}</li>`).join('')}</ul>`);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length
      && lines[index].trim()
      && !/^#{1,6}\s/.test(lines[index])
      && !lines[index].startsWith('```')
      && !lines[index].startsWith('|')
      && !/^\s*\d+\.\s/.test(lines[index])
      && !/^\s*-\s/.test(lines[index])
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    html.push(`<p>${renderInline(paragraph.join(' '), sourcePath)}</p>`);
  }

  return {
    content: html.join('\n'),
    toc
  };
}

function renderCodeBlock(code, language) {
  const normalizedLanguage = escapeAttribute(language || 'text');
  const label = escapeHtml(formatLanguageLabel(normalizedLanguage));
  return [
    '<div class="code-shell">',
    `<div class="code-toolbar"><span class="code-language">${label}</span><button class="copy-button" type="button">copy</button></div>`,
    `<pre class="code-block" data-language="${normalizedLanguage}"><code class="language-${normalizedLanguage}">${escapeHtml(code)}</code></pre>`,
    '</div>'
  ].join('');
}

function wrapDocContent(content) {
  return [
    '<article class="doc-frame">',
    '<div class="doc-ruler" aria-hidden="true"></div>',
    `<div class="doc-body markdown">${content}</div>`,
    '</article>'
  ].join('');
}

function renderChipRow(labels) {
  return render(templates.chipRow, {
    items: labels.map(label => ({ label: escapeHtml(label) }))
  });
}

function renderTable(lines, sourcePath) {
  const rows = lines
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^\||\|$/g, '').split('|').map(cell => cell.trim()));

  if (rows.length < 2) {
    return '';
  }

  const [header, separator, ...body] = rows;
  if (!separator.every(cell => /^:?-{3,}:?$/.test(cell))) {
    return '';
  }

  return [
    '<div class="table-wrap">',
    '<table>',
    `<thead><tr>${header.map(cell => `<th>${renderInline(cell, sourcePath)}</th>`).join('')}</tr></thead>`,
    `<tbody>${body.map(row => `<tr>${row.map(cell => `<td>${renderInline(cell, sourcePath)}</td>`).join('')}</tr>`).join('')}</tbody>`,
    '</table>',
    '</div>'
  ].join('');
}

function renderInline(text, sourcePath) {
  const links = [];
  const working = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const id = links.push(
      `<a href="${escapeAttribute(resolveLink(href, sourcePath))}" title="${escapeAttribute(stripTags(renderStyledText(label)))}">${renderStyledText(label)}</a>`
    ) - 1;
    return `%%LINK_${id}%%`;
  });

  return renderStyledText(working).replace(/%%LINK_(\d+)%%/g, (_, id) => links[Number(id)] || '');
}

function renderStyledText(text) {
  const codes = [];
  let working = text.replace(/`([^`]+)`/g, (_, code) => {
    const id = codes.push(`<code>${escapeHtml(code)}</code>`) - 1;
    return `%%CODE_${id}%%`;
  });

  working = escapeHtml(working);
  working = working.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  return working.replace(/%%CODE_(\d+)%%/g, (_, id) => codes[Number(id)] || '');
}

function resolveLink(href, sourcePath) {
  if (/^(https?:|mailto:|#)/.test(href)) {
    return href;
  }

  const fromDir = path.posix.dirname(sourcePath);
  const target = path.posix.normalize(path.posix.join(fromDir, href));
  if (target === 'examples' || target.startsWith('../examples/') || target.startsWith('examples/')) {
    return `${repoUrl}/tree/main/${target.replace(/^\.\.\//, '')}`;
  }
  if (pageMap.has(target)) {
    return relativeHref(pageMap.get(sourcePath), pageMap.get(target));
  }

  return href.replace(/\.md$/, '.html');
}

function extractListSection(markdown, heading) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex(line => line.trim() === heading.trim());
  if (start === -1) {
    return [];
  }

  const items = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s/.test(line)) {
      break;
    }
    if (/^\s*-\s/.test(line)) {
      items.push(line.replace(/^\s*-\s/, '').trim());
    }
  }
  return items;
}

function extractOrderedList(markdown, heading) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const start = lines.findIndex(line => line.trim() === heading.trim());
  if (start === -1) {
    return [];
  }

  const items = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^##\s/.test(line)) {
      break;
    }
    if (/^\s*\d+\.\s/.test(line)) {
      items.push(line.replace(/^\s*\d+\.\s/, '').trim());
    }
  }
  return items;
}

function formatLanguageLabel(language) {
  const normalized = language.toLowerCase();
  if (normalized === 'ts' || normalized === 'typescript') return 'TypeScript';
  if (normalized === 'js' || normalized === 'javascript') return 'JavaScript';
  if (normalized === 'sh' || normalized === 'bash') return 'Bash';
  if (normalized === 'html') return 'HTML';
  if (normalized === 'json') return 'JSON';
  return language || 'Text';
}

function relativeHref(fromOutput, toOutput) {
  const fromDir = path.posix.dirname(fromOutput);
  const relative = path.posix.relative(fromDir, toOutput);
  return relative || path.posix.basename(toOutput);
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[`'"“”]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

function stripTags(value) {
  return String(value).replace(/<[^>]*>/g, '');
}

function templateKey(name) {
  return name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
