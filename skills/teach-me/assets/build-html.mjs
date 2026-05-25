#!/usr/bin/env node
// Build the self-contained index.html for a /teach-me course.
// Run: node build-html.mjs <course-dir>
//
// Pre-renders code blocks with Shiki (dual github-light / github-dark themes,
// CSS-variable mode) so the runtime needs no highlighting library.

import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import { createHighlighter } from 'shiki';

const SCRIPT_DIR = path.dirname(url.fileURLToPath(import.meta.url));

const courseDir = path.resolve(process.argv[2] ?? '.');
if (!courseDir) {
  console.error('Usage: node build-html.mjs <course-dir>');
  process.exit(1);
}

const TEMPLATE = path.join(SCRIPT_DIR, 'templates', 'index.template.html');
const STYLES = path.join(SCRIPT_DIR, 'styles.css');
const VIEWER = path.join(SCRIPT_DIR, 'viewer.js');
const MARKED = path.join(SCRIPT_DIR, 'marked.min.js');

const LANG_ALIASES = {
  ts: 'typescript',
  js: 'javascript',
  sh: 'bash',
  shell: 'bash',
  yml: 'yaml',
  py: 'python',
};

const SUPPORTED_LANGS = [
  'typescript', 'javascript', 'tsx', 'jsx',
  'json', 'yaml', 'bash', 'shell', 'python', 'go',
  'sql', 'html', 'css', 'markdown', 'diff',
];

function readText(p) { return fs.readFile(p, 'utf8'); }

function escapeForScriptTag(s) {
  return s
    .replace(/<\/script/gi, '<\\/script')
    .replace(/<!--/g, '<\\!--');
}

function htmlEscape(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

const CODE_FENCE_RE = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;

function highlightChapterCode(markdown, highlighter) {
  // Walk all fenced code blocks via matchAll and replace each with Shiki HTML.
  // Marked.js will see the raw HTML and pass it through.
  const matches = Array.from(markdown.matchAll(CODE_FENCE_RE));
  if (matches.length === 0) return markdown;
  const parts = [];
  let cursor = 0;
  for (const m of matches) {
    parts.push(markdown.slice(cursor, m.index));
    const rawLang = (m[1] || '').toLowerCase();
    const code = m[2];
    const lang = LANG_ALIASES[rawLang] ?? rawLang;
    const useLang = SUPPORTED_LANGS.includes(lang) ? lang : null;
    let highlighted;
    if (useLang) {
      try {
        highlighted = highlighter.codeToHtml(code, {
          lang: useLang,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
        });
      } catch (_err) {
        highlighted = renderFallback(code);
      }
    } else {
      highlighted = renderFallback(code);
    }
    parts.push('\n' + highlighted + '\n');
    cursor = m.index + m[0].length;
  }
  parts.push(markdown.slice(cursor));
  return parts.join('');
}

function renderFallback(code) {
  return `<pre class="shiki shiki-plain"><code>${htmlEscape(code)}</code></pre>`;
}

function buildChapterNavHtml(meta) {
  const items = (meta.chapters ?? []).map((c) => {
    const title = htmlEscape(c.title ?? `Chapter ${c.number}`);
    return `<li class="chapter-item"><a href="#" class="chapter-link" data-chapter="${c.number}"><span class="chapter-number">${c.number}</span><span class="chapter-title">${title}</span></a></li>`;
  });
  return items.join('\n          ');
}

async function buildChapterMarkdownScripts(courseDir, meta, highlighter) {
  const scripts = [];
  for (const c of meta.chapters ?? []) {
    const file = c.file ?? `${String(c.number).padStart(2, '0')}-${c.slug}.md`;
    const filePath = path.join(courseDir, file);
    let raw;
    try {
      raw = await readText(filePath);
    } catch (_err) {
      console.warn(`  warn: chapter file missing: ${file}`);
      continue;
    }
    const withShiki = highlightChapterCode(raw, highlighter);
    const safe = escapeForScriptTag(withShiki);
    scripts.push(`<script type="text/markdown" data-chapter="${c.number}" id="ch-${c.number}">${safe}</script>`);
  }
  return scripts.join('\n  ');
}

function firstSentence(s, max = 120) {
  if (!s) return '';
  const cleaned = String(s).replace(/\s+/g, ' ').trim();
  const m = cleaned.match(/^[^.!?\n]{1,200}[.!?]/);
  const candidate = m ? m[0] : cleaned;
  return candidate.length > max ? candidate.slice(0, max - 1) + '…' : candidate;
}

async function main() {
  console.log(`Course dir: ${courseDir}`);
  const [template, styles, viewer, marked, courseMetaRaw, conceptsRaw, termsRaw, resourcesRaw] = await Promise.all([
    readText(TEMPLATE),
    readText(STYLES),
    readText(VIEWER),
    readText(MARKED),
    readText(path.join(courseDir, 'course-meta.json')),
    readText(path.join(courseDir, 'concepts.json')),
    readText(path.join(courseDir, 'terms.json')),
    readText(path.join(courseDir, 'resources.json')).catch(() => '{}'),
  ]);

  const meta = JSON.parse(courseMetaRaw);

  console.log('Loading Shiki...');
  const highlighter = await createHighlighter({
    themes: ['github-light', 'github-dark'],
    langs: SUPPORTED_LANGS,
  });
  console.log(`Shiki ready with langs: ${SUPPORTED_LANGS.join(', ')}`);

  console.log('Highlighting chapters...');
  const chapterScripts = await buildChapterMarkdownScripts(courseDir, meta, highlighter);
  const chapterNav = buildChapterNavHtml(meta);

  const courseMetaSafe = escapeForScriptTag(courseMetaRaw);
  const conceptsSafe = escapeForScriptTag(conceptsRaw);
  const termsSafe = escapeForScriptTag(termsRaw);
  const resourcesSafe = escapeForScriptTag(resourcesRaw);

  const goalLine = firstSentence(meta.goal ?? '');

  const substitutions = {
    '{{COURSE_TITLE}}': htmlEscape(meta.title ?? 'Course'),
    '{{GOAL_LINE}}': htmlEscape(goalLine),
    '{{STYLES_CSS}}': styles,
    '{{MARKED_JS}}': marked,
    '{{VIEWER_JS}}': viewer,
    '{{CHAPTER_NAV_HTML}}': chapterNav,
    '{{CHAPTER_MARKDOWN_SCRIPTS}}': chapterScripts,
    '{{COURSE_META_JSON}}': courseMetaSafe,
    '{{CONCEPTS_JSON}}': conceptsSafe,
    '{{TERMS_JSON}}': termsSafe,
    '{{RESOURCES_JSON}}': resourcesSafe,
  };

  let out = template;
  for (const [k, v] of Object.entries(substitutions)) {
    out = out.split(k).join(v);
  }

  // Strip any leftover placeholders (e.g. old HIGHLIGHT_JS slot in older templates).
  out = out.replace(/<script>\s*\{\{[A-Z_]+\}\}\s*<\/script>/g, '');
  out = out.replace(/\{\{[A-Z_]+\}\}/g, '');

  const outPath = path.join(courseDir, 'index.html');
  await fs.writeFile(outPath, out, 'utf8');

  const stats = await fs.stat(outPath);
  console.log(`Wrote ${outPath} (${(stats.size / 1024).toFixed(1)} KB)`);
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
