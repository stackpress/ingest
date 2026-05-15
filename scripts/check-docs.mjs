import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const docsDir = path.join(root, 'docs');

async function main() {
  const htmlFiles = await listFiles(docsDir, '.html');
  const issues = [];

  for (const filePath of htmlFiles) {
    const html = await fs.readFile(filePath, 'utf8');
    const relativePath = path.relative(root, filePath);

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

  console.log(`Validated ${htmlFiles.length} HTML files in docs/.`);
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
