#!/usr/bin/env node
/**
 * PreToolUse guard for the accessible-html skill.
 *
 * Why this exists: pressure-testing the skill showed agents sometimes never load it
 * (a terse "just add this one line" request produced zero tool calls and a fabricated
 * "SKILLS USED" line). A skill cannot enforce itself. This hook runs in the harness,
 * so it fires whether or not the model chose to read anything.
 *
 * It never blocks. It scans the markup about to be written and injects a short note
 * naming only the defects actually present. Clean content produces no output at all,
 * which is what keeps it from becoming noise the model learns to ignore.
 */

const MARKUP_EXT =
  /\.(html?|jsx|tsx|vue|svelte|astro|css|scss|sass|less|php|erb|hbs|handlebars|ejs|twig|blade\.php|razor|cshtml)$/i;

// Each check: name, test(text) -> boolean, msg. Kept high-precision on purpose —
// a false positive here costs more trust than a missed defect.
const CHECKS = [
  {
    id: 'focus-ring',
    test: (t) => /outline\s*:\s*(none|0)\b/i.test(t) && !/:focus-visible/i.test(t),
    msg: 'outline:none with no :focus-visible replacement — keyboard users lose all focus indication. Keep a ring (>=2px, >=3:1 contrast, use `outline` so it survives forced-colors).',
  },
  {
    id: 'div-onclick',
    test: (t) => /<(div|span|li|td|tr|p|h[1-6])\b[^>]*\son[Cc]lick/i.test(t),
    msg: 'Click handler on a non-interactive element — no focus, no Enter/Space, no role. Use <button type="button"> (or <a href> to navigate) and reset styles in CSS.',
  },
  {
    id: 'anchor-no-href',
    test: (t) => /<a\b(?![^>]*\bhref)[^>]*\son[Cc]lick/i.test(t),
    msg: '<a> with a click handler but no href — not focusable, breaks middle-click/Cmd-click/copy-link. Add href, or use <button>.',
  },
  {
    id: 'positive-tabindex',
    test: (t) => /tab[Ii]ndex\s*=\s*["'{]?\s*[1-9]/.test(t),
    msg: 'Positive tabindex — breaks natural tab order and jumps ahead of every other element on the page. Only 0 and -1 are ever correct.',
  },
  {
    id: 'img-no-alt',
    test: (t) => matchTags(t, 'img').some((tag) => !/\salt\s*=/i.test(tag)),
    msg: '<img> without alt — describe it, or alt="" if purely decorative. Missing alt is the 2nd most common a11y failure on the web.',
  },
  {
    id: 'iframe-no-title',
    test: (t) => matchTags(t, 'iframe').some((tag) => !/\stitle\s*=/i.test(tag)),
    msg: '<iframe> without title — screen reader users get an unlabelled frame in their element list.',
  },
  {
    id: 'zoom-blocked',
    test: (t) => /user-scalable\s*=\s*["']?\s*no|maximum-scale\s*=\s*["']?\s*1(?![.\d])/i.test(t),
    msg: 'Pinch zoom disabled — a WCAG 1.4.4 failure that locks out low-vision users. Use content="width=device-width, initial-scale=1" and fix the layout instead.',
  },
  {
    id: 'aria-label-on-generic',
    test: (t) => /<(div|span)\b(?![^>]*\brole\s*=)[^>]*\saria-label\s*=/i.test(t),
    msg: 'aria-label on a <div>/<span> with no role — it is ignored entirely. Give the element a role, or use a real element.',
  },
  {
    id: 'list-style-none',
    test: (t) => /list-style(-type)?\s*:\s*none/i.test(t) && !/role\s*=\s*["']list["']/i.test(t),
    msg: 'list-style:none drops list semantics in Safari — add role="list" to the <ul>/<ol>.',
  },
  {
    id: 'menu-no-arrows',
    test: (t) =>
      /role\s*=\s*["']menu["']/i.test(t) && !/Arrow(Down|Up|Left|Right)/.test(t),
    msg: 'role="menu" without arrow-key handling — you promised a menu contract you did not implement. A dropdown of links should be a <nav> with a <ul> of <a>, not a menu.',
  },
  {
    id: 'placeholder-as-label',
    test: (t) =>
      /<input\b[^>]*\splaceholder\s*=/i.test(t) &&
      !/<label|htmlFor\s*=|aria-label(ledby)?\s*=/i.test(t),
    msg: 'Input with a placeholder and no label anywhere — placeholder is not a label (it vanishes on typing, fails contrast, and is read inconsistently). Add <label for>, visually hidden if the design has no visible label.',
  },
  {
    id: 'bare-key-shortcut',
    test: (t) =>
      /addEventListener\s*\(\s*['"]keydown/.test(t) &&
      /\.key\s*===?\s*['"][a-z0-9/?]['"]/i.test(t) &&
      !/localStorage|shortcutsEnabled|settings|preference|remap/i.test(t),
    msg: 'Single-character keyboard shortcut with no off switch — WCAG 2.1.4 (Level A) requires it be disableable, remappable, or focus-scoped. Speech-recognition users emit stray characters constantly.',
  },
];

/** Return the raw text of every `<name ...>` opening tag in the text. */
function matchTags(text, name) {
  return text.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];
}

/** Pull every chunk of content this tool call would write. */
function extractText(input) {
  const parts = [];
  if (typeof input.content === 'string') parts.push(input.content);
  if (typeof input.new_string === 'string') parts.push(input.new_string);
  if (Array.isArray(input.edits)) {
    for (const e of input.edits) {
      if (e && typeof e.new_string === 'string') parts.push(e.new_string);
    }
  }
  return parts.join('\n');
}

function main(raw) {
  let payload;
  try {
    // Strip a leading BOM: some shells (PowerShell piping to a native process)
    // prepend one, and JSON.parse rejects it — a silent no-op hook is worse than none.
    payload = JSON.parse(raw.replace(/^﻿/, ''));
  } catch {
    return null; // malformed stdin is not our problem — stay out of the way
  }

  const input = payload.tool_input || {};
  const file = input.file_path || '';
  if (!MARKUP_EXT.test(file)) return null;

  const text = extractText(input);
  if (!text.trim()) return null;

  const hits = CHECKS.filter((c) => {
    try {
      return c.test(text);
    } catch {
      return false; // a broken check must never break the edit
    }
  });
  if (!hits.length) return null;

  const lines = hits.map((h) => `- ${h.msg}`).join('\n');
  return [
    `Accessibility issues detected in the markup you are about to write to ${file}:`,
    '',
    lines,
    '',
    'Fix these in this edit — not in a follow-up. If you have not read the accessible-html skill this turn, read it now (references/keyboard-and-focus.md for focus/keys, references/components.md for widget contracts).',
  ].join('\n');
}

let stdin = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => (stdin += d));
process.stdin.on('end', () => {
  let context = null;
  try {
    context = main(stdin);
  } catch {
    context = null;
  }
  if (context) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          additionalContext: context,
        },
      })
    );
  }
  process.exit(0);
});
