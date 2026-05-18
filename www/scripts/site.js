const themeStorageKey = 'ingest-docs-theme';

const preferredTheme = (() => {
  const stored = localStorage.getItem(themeStorageKey);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
})();

applyTheme(preferredTheme);

window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('theme-toggle');
  updateThemeToggle(toggle, document.documentElement.dataset.theme || 'light');

  toggle?.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(nextTheme);
    localStorage.setItem(themeStorageKey, nextTheme);
    updateThemeToggle(toggle, nextTheme);
  });

  for (const code of document.querySelectorAll('.code-block code')) {
    const parent = code.closest('.code-block');
    const language = parent?.dataset.language || '';
    code.innerHTML = highlightCode(code.textContent || '', language);
  }

  for (const button of document.querySelectorAll('.copy-button')) {
    button.addEventListener('click', async () => {
      const shell = button.closest('.code-shell');
      const code = shell?.querySelector('.code-block code');
      const text = code?.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        button.textContent = 'Copied';
        window.setTimeout(() => {
          button.textContent = 'copy';
        }, 1400);
      } catch {
        button.textContent = 'Copy failed';
        window.setTimeout(() => {
          button.textContent = 'copy';
        }, 1400);
      }
    });
  }
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function updateThemeToggle(toggle, theme) {
  if (!toggle) {
    return;
  }
  toggle.innerHTML = theme === 'dark'
    ? '<span class="theme-toggle-icon">☾</span><span class="theme-toggle-label">Dark</span>'
    : '<span class="theme-toggle-icon">☀</span><span class="theme-toggle-label">Light</span>';
}

function highlightCode(source, language) {
  const normalized = language.toLowerCase();
  if (normalized === 'ts' || normalized === 'typescript' || normalized === 'js' || normalized === 'javascript') {
    return highlightScript(source);
  }
  if (normalized === 'json') {
    return highlightJson(source);
  }
  if (normalized === 'sh' || normalized === 'bash') {
    return highlightBash(source);
  }
  if (normalized === 'html') {
    return highlightHtml(source);
  }
  return escapeHtml(source);
}

function highlightScript(source) {
  const keywords = /\b(import|from|const|let|var|return|async|await|if|else|for|while|try|catch|throw|new|class|extends|function|export|default|typeof|instanceof|true|false|null|undefined)\b/g;
  return applyTokenHighlighter(source, [
    { regex: /\/\/.*$/gm, className: 'token-comment' },
    { regex: /\/\*[\s\S]*?\*\//g, className: 'token-comment' },
    { regex: /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, className: 'token-string' }
  ], escaped => escaped
    .replace(keywords, '<span class="token-keyword">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="token-number">$1</span>')
    .replace(/\b(server|router|app|get|setJSON|listen|bootstrap|create)\b/g, '<span class="token-function">$1</span>')
  );
}

function highlightJson(source) {
  return applyTokenHighlighter(source, [
    { regex: /"(?:\\.|[^"\\])*"(?=\s*:)/g, className: 'token-property' },
    { regex: /"(?:\\.|[^"\\])*"/g, className: 'token-string' }
  ], escaped => escaped
    .replace(/\b(true|false|null)\b/g, '<span class="token-keyword">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="token-number">$1</span>')
  );
}

function highlightBash(source) {
  return applyTokenHighlighter(source, [
    { regex: /#.*$/gm, className: 'token-comment' },
    { regex: /'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, className: 'token-string' }
  ], escaped => escaped
    .replace(/\b(yarn|node|npm|git|cd|export)\b/g, '<span class="token-function">$1</span>')
    .replace(/(^|\s)(--?[a-z0-9-]+)/g, '$1<span class="token-keyword">$2</span>')
  );
}

function highlightHtml(source) {
  return applyTokenHighlighter(source, [
    { regex: /<!--[\s\S]*?-->/g, className: 'token-comment' }
  ], escaped => escaped
    .replace(/(&lt;\/?)([a-z0-9-]+)/gi, '$1<span class="token-keyword">$2</span>')
    .replace(/\s([a-z-:]+)=/gi, ' <span class="token-property">$1</span>=')
    .replace(/"(.*?)"/g, '<span class="token-string">"$1"</span>')
  );
}

function applyTokenHighlighter(source, patterns, postProcess) {
  const tokens = [];
  let value = source;

  for (const pattern of patterns) {
    value = value.replace(pattern.regex, match => {
      const token = `<span class="${pattern.className}">${escapeHtml(match)}</span>`;
      return `%%TOKEN_${tokens.push(token) - 1}%%`;
    });
  }

  value = escapeHtml(value);
  value = postProcess(value);

  return value.replace(/%%TOKEN_(\d+)%%/g, (_, id) => tokens[Number(id)] || '');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
