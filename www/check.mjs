import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs');
const expectedPages = [
  'index.html',
  'overview.html',
  'concepts/index.html',
  'guides/create-a-server.html',
  'api/index.html'
];
const expectedAssets = [
  'favicon.ico',
  'icon.png',
  'ingest.png',
  'site.css',
  'site.js'
];

async function main() {
  const htmlFiles = await listFiles(docsDir, '.html');
  const issues = [];

  validateExpectedOutputs(issues);

  for (const filePath of htmlFiles) {
    const html = await fs.readFile(filePath, 'utf8');
    const relativePath = path.relative(root, filePath);

    validateMetadata(relativePath, html, issues);

    if (/%%(?:TOKEN|LINK|CODE)_\d+%%/.test(html)) {
      issues.push(`${relativePath}: unresolved template token found`);
    }

    for (const href of html.matchAll(/\bhref="([^"]+)"/g)) {
      validateReference(relativePath, filePath, href[1], 'href', issues);
    }

    for (const src of html.matchAll(/\bsrc="([^"]+)"/g)) {
      validateReference(relativePath, filePath, src[1], 'src', issues);
    }
  }

  if (issues.length) {
    console.error('Docs validation failed:\n');
    for (const issue of issues) {
      console.error(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Validated ${htmlFiles.length} HTML files and ${expectedAssets.length} assets in docs/.`);
}

function validateExpectedOutputs(issues) {
  for (const page of expectedPages) {
    const outputPath = path.join(docsDir, page);
    if (!existsSync(outputPath)) {
      issues.push(`missing expected page (${path.relative(root, outputPath)})`);
    }
  }

  for (const asset of expectedAssets) {
    const outputPath = path.join(docsDir, 'assets', asset);
    if (!existsSync(outputPath)) {
      issues.push(`missing expected asset (${path.relative(root, outputPath)})`);
    }
  }
}

function validateMetadata(relativePath, html, issues) {
  const requiredPatterns = [
    [/<title>\s*[^<].*<\/title>/i, 'missing populated <title>'],
    [/<meta name="description" content="[^"]+"/i, 'missing meta description'],
    [/<meta property="og:title" content="[^"]+"/i, 'missing og:title'],
    [/<meta property="og:description" content="[^"]+"/i, 'missing og:description'],
    [/<meta property="og:type" content="[^"]+"/i, 'missing og:type'],
    [/<meta name="twitter:card" content="[^"]+"/i, 'missing twitter:card'],
    [/<meta name="twitter:title" content="[^"]+"/i, 'missing twitter:title'],
    [/<meta name="twitter:description" content="[^"]+"/i, 'missing twitter:description']
  ];

  for (const [pattern, message] of requiredPatterns) {
    if (!pattern.test(html)) {
      issues.push(`${relativePath}: ${message}`);
    }
  }
}

function validateReference(relativePath, filePath, value, kind, issues) {
  if (!value || value.startsWith('#') || /^(https?:|mailto:|data:)/.test(value)) {
    return;
  }

  if (value.endsWith('.md')) {
    issues.push(`${relativePath}: ${kind} still points to markdown (${value})`);
    return;
  }

  const clean = value.split('#')[0].split('?')[0];
  if (!clean) {
    return;
  }

  const targetPath = path.resolve(path.dirname(filePath), clean);
  if (!existsSync(targetPath)) {
    issues.push(`${relativePath}: missing ${kind} target (${value})`);
  }
}

async function listFiles(directory, extension) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(target, extension));
      continue;
    }

    if (entry.isFile() && target.endsWith(extension)) {
      files.push(target);
    }
  }

  return files.sort();
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
