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

// ---------------------------------------------------------------------------
// Callout pre-processor
// ---------------------------------------------------------------------------
// Detects GFM-style `> [!TYPE]` alerts AND legacy conventions like
// `> **Analogy**:`, `> **Self-explain**:`, `> **Where this breaks down**:`,
// `> **Note**:`, `> **Tip**:`, `> **Warning**:`. Transforms each into a
// styled <aside class="callout callout-X"> block.

const CALLOUT_TYPES = {
  note: { label: 'Note', icon: 'ℹ' },
  tip: { label: 'Tip', icon: '✦' },
  important: { label: 'Important', icon: '★' },
  warning: { label: 'Warning', icon: '⚠' },
  caution: { label: 'Caution', icon: '⚠' },
  danger: { label: 'Danger', icon: '⚠' },
  insight: { label: 'Insight', icon: '💡' },
  analogy: { label: 'Analogy', icon: '🔗' },
  breakdown: { label: 'Where this breaks down', icon: '🔧' },
  'self-explain': { label: 'Self-explain', icon: '✎' },
  quote: { label: 'Quote', icon: '❝' },
  history: { label: 'War story', icon: '📜' },
};

// Loose-pattern detection: first line of a blockquote starts with **Label**:
const LOOSE_PATTERNS = [
  { regex: /^\*\*Self-explain\*\*:?/i, type: 'self-explain' },
  { regex: /^\*\*Analogy\*\*:?/i, type: 'analogy' },
  { regex: /^\*\*Where this breaks down\*\*:?/i, type: 'breakdown' },
  { regex: /^\*\*Insight\*\*:?/i, type: 'insight' },
  { regex: /^\*\*Note\*\*:?/i, type: 'note' },
  { regex: /^\*\*Tip\*\*:?/i, type: 'tip' },
  { regex: /^\*\*Warning\*\*:?/i, type: 'warning' },
  { regex: /^\*\*Important\*\*:?/i, type: 'important' },
  { regex: /^\*\*Caution\*\*:?/i, type: 'caution' },
];

function transformCallouts(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Detect start of a blockquote.
    if (line.startsWith('> ') || line === '>') {
      // Collect the whole blockquote (consecutive `>` lines).
      const blockLines = [];
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>')) {
        blockLines.push(lines[i].replace(/^> ?/, ''));
        i++;
      }
      const inner = blockLines.join('\n');
      // Split the blockquote into paragraphs (blank-line separated). If each
      // paragraph starts with its own label, emit each as a separate callout.
      const paragraphs = inner.split(/\n\s*\n/);
      const detected = paragraphs.map((p) => ({ p, c: detectCalloutType(p) }));
      const labeled = detected.filter((d) => d.c);
      if (labeled.length >= 2 && labeled.length === detected.length) {
        // Every paragraph is labeled — emit a callout per paragraph.
        for (const d of detected) {
          out.push(renderCallout(d.c.type, d.c.cleanedBody));
          out.push('');
        }
        continue;
      }
      const calloutType = detectCalloutType(inner);
      if (calloutType) {
        out.push(renderCallout(calloutType.type, calloutType.cleanedBody));
        out.push('');
        continue;
      }
      // Not a callout — emit the blockquote unchanged.
      for (const bl of blockLines) {
        out.push('> ' + bl);
      }
      continue;
    }
    out.push(line);
    i++;
  }
  return out.join('\n');
}

function detectCalloutType(inner) {
  // GFM alert: `[!TYPE]` on the first line.
  const gfm = inner.match(/^\[!(\w[-\w]*)\]\s*\n?/);
  if (gfm) {
    const t = gfm[1].toLowerCase();
    if (CALLOUT_TYPES[t]) {
      return { type: t, cleanedBody: inner.slice(gfm[0].length).trimStart() };
    }
  }
  // Loose pattern: first line starts with `**Label**:`.
  const firstLine = inner.split('\n', 1)[0];
  for (const { regex, type } of LOOSE_PATTERNS) {
    if (regex.test(firstLine)) {
      const cleaned = inner.replace(regex, '').replace(/^[:\s]+/, '').trimStart();
      return { type, cleanedBody: cleaned };
    }
  }
  return null;
}

function renderCallout(type, body) {
  const meta = CALLOUT_TYPES[type] ?? { label: type, icon: '•' };
  // Use a markdown-friendly inner: blank lines around so marked.js still parses inside.
  return [
    `<aside class="callout callout-${type}">`,
    `  <header class="callout-header"><span class="callout-icon" aria-hidden="true">${meta.icon}</span><span class="callout-title">${htmlEscape(meta.label)}</span></header>`,
    `  <div class="callout-body">`,
    '',
    body,
    '',
    `  </div>`,
    `</aside>`,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Details body wrapper
// ---------------------------------------------------------------------------
// Wraps the content of every <details> block (after </summary>) in a
// <div class="details-body"> so CSS can apply real padding. Without this,
// inline writing like:
//
//     <details><summary>Q?</summary>Bare text answer</details>
//
// leaves the body as a raw text node — `> *:not(summary)` selectors miss it
// entirely. Wrapping forces an element child that styles can target.

const DETAILS_BLOCK_RE = /<details([^>]*)>([\s\S]*?)<\/details>/gi;
const SUMMARY_BLOCK_RE = /<summary[^>]*>[\s\S]*?<\/summary>/i;

function transformDetailsBodies(markdown) {
  return markdown.replace(DETAILS_BLOCK_RE, function (_full, attrs, inner) {
    if (/<div\s+class=["']details-body["']/i.test(inner)) {
      return `<details${attrs}>${inner}</details>`;
    }
    const sm = inner.match(SUMMARY_BLOCK_RE);
    if (!sm) {
      return `<details${attrs}>${inner}</details>`;
    }
    const summaryHtml = sm[0];
    const summaryEnd = inner.indexOf(summaryHtml) + summaryHtml.length;
    const body = inner.slice(summaryEnd).replace(/^[\s\n]+/, '').replace(/[\s\n]+$/, '');
    if (!body) {
      return `<details${attrs}>${inner}</details>`;
    }
    return [
      `<details${attrs}>`,
      summaryHtml,
      '',
      '<div class="details-body">',
      '',
      body,
      '',
      '</div>',
      '',
      '</details>',
    ].join('\n');
  });
}

// ---------------------------------------------------------------------------
// Diagram figure wrapper
// ---------------------------------------------------------------------------
// Detects ![alt](path.svg) followed (optionally) by a `*caption*` line and
// replaces with <figure class="diagram-card"><img ...><figcaption>...</figcaption></figure>.
// This gives every diagram a high-contrast card that reads well in both themes,
// without asking chapter writers to write raw HTML.

const DIAGRAM_IMG_LINE_RE = /^!\[([^\]]*)\]\(([^)]+\.svgx?)\)\s*$/gm;

function transformDiagramFigures(markdown) {
  const lines = markdown.split('\n');
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/^!\[([^\]]*)\]\(([^)]+\.svg)\)\s*$/);
    if (m) {
      const alt = m[1];
      const src = m[2];
      // Look ahead for a caption: optional blank lines then `*caption*`.
      let j = i + 1;
      while (j < lines.length && lines[j].trim() === '') j++;
      let caption = '';
      let consumed = i + 1;
      if (j < lines.length) {
        const capMatch = lines[j].match(/^\*([^*][\s\S]*?)\*\s*$/);
        if (capMatch) {
          caption = capMatch[1];
          consumed = j + 1;
        }
      }
      out.push('<figure class="diagram-card">');
      out.push(`  <img src="${htmlEscape(src)}" alt="${htmlEscape(alt)}" loading="lazy">`);
      if (caption) {
        out.push(`  <figcaption>${caption}</figcaption>`);
      }
      out.push('</figure>');
      i = consumed;
      continue;
    }
    out.push(line);
    i++;
  }
  return out.join('\n');
}

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
    const withCallouts = transformCallouts(raw);
    const withDetails = transformDetailsBodies(withCallouts);
    const withFigures = transformDiagramFigures(withDetails);
    const withShiki = highlightChapterCode(withFigures, highlighter);
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
