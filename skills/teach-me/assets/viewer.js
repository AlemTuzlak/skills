/* teach-me viewer — self-contained, vanilla JS.
 * Content comes from build-time generation by the /teach-me skill, not from untrusted user input.
 * setHtml() routes generated markup through DOMParser to keep the integration explicit.
 */
(function () {
  'use strict';

  function getJson(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    try { return JSON.parse(el.textContent || 'null'); } catch (_) { return null; }
  }

  const courseMeta = getJson('course-meta') || {};
  const termLedger = getJson('term-ledger') || [];
  const resourcesData = getJson('resources-data') || {};

  const STORAGE_KEY = 'teach-me:' + (courseMeta.slug || 'course') + ':progress';
  const cards = [];
  let currentCardIndex = 0;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function setHtml(el, html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString('<!DOCTYPE html><body>' + html + '</body>', 'text/html');
    el.replaceChildren.apply(el, Array.from(doc.body.childNodes));
  }

  function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  /* ---------- Markdown setup ---------- */

  if (typeof marked !== 'undefined') {
    marked.setOptions({ gfm: true, breaks: false, headerIds: false, mangle: false });
  }

  function renderMd(src) {
    if (typeof marked === 'undefined') {
      return '<pre>' + escapeHtml(src) + '</pre>';
    }
    try { return marked.parse(src); }
    catch (err) { console.error('Markdown render error', err); return '<pre>' + escapeHtml(src) + '</pre>'; }
  }

  // Code highlighting is pre-rendered at build time by Shiki — no runtime work needed.
  function highlightAll(_scope) { /* no-op */ }

  /* ---------- Card extraction ---------- */

  function stripFrontmatter(md) {
    const trimmed = md.replace(/^\s+/, '');
    if (!trimmed.startsWith('---')) return md;
    const closingIdx = trimmed.indexOf('\n---', 3);
    if (closingIdx === -1) return md;
    const afterFm = trimmed.slice(closingIdx + 4);
    return afterFm.replace(/^\s*\n/, '');
  }

  function splitIntoCards(md) {
    const body = stripFrontmatter(md);
    const parts = body.split(/\n[ \t]*-{3,}[ \t]*\n/);
    return parts.map(function (p) { return p.trim(); }).filter(function (p) { return p.length > 0; });
  }

  function buildCards() {
    const chapterScripts = document.querySelectorAll('script[type="text/markdown"][data-chapter]');
    chapterScripts.forEach(function (script) {
      const chapterNum = parseInt(script.dataset.chapter, 10);
      const chapterMeta = (courseMeta.chapters || []).find(function (c) { return c.number === chapterNum; }) || {};
      const chapterSlug = chapterMeta.slug || ('ch-' + chapterNum);
      const chapterTitle = chapterMeta.title || ('Chapter ' + chapterNum);
      const cardSources = splitIntoCards(script.textContent);
      cardSources.forEach(function (rawMd, idx) {
        cards.push({
          chapterNum: chapterNum,
          chapterSlug: chapterSlug,
          chapterTitle: chapterTitle,
          cardIndex: idx,
          totalCards: cardSources.length,
          rawMd: rawMd,
          renderedHtml: '',
        });
      });
    });
    cards.sort(function (a, b) {
      if (a.chapterNum !== b.chapterNum) return a.chapterNum - b.chapterNum;
      return a.cardIndex - b.cardIndex;
    });
  }

  /* ---------- Glossary term wrapping ---------- */

  function buildTermRegex() {
    if (!termLedger.length) return null;
    const escaped = termLedger
      .map(function (t) { return t.term; })
      .filter(Boolean)
      .sort(function (a, b) { return b.length - a.length; })
      .map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
    if (!escaped.length) return null;
    return new RegExp('\\b(' + escaped.join('|') + ')\\b', 'gi');
  }

  const termRegex = buildTermRegex();
  const termMap = new Map(termLedger.map(function (t) { return [t.term.toLowerCase(), t]; }));

  function wrapTerms(rootEl) {
    if (!termRegex) return;
    const SKIP_TAGS = new Set(['CODE', 'PRE', 'SUMMARY', 'A', 'SCRIPT', 'STYLE', 'H1', 'H2', 'H3']);
    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        let parent = node.parentNode;
        while (parent && parent !== rootEl) {
          if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
          if (parent.classList && parent.classList.contains('term-link')) return NodeFilter.FILTER_REJECT;
          parent = parent.parentNode;
        }
        return termRegex.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);
    nodes.forEach(function (node) {
      const text = node.nodeValue;
      const matches = Array.from(text.matchAll(termRegex));
      if (!matches.length) return;
      const frag = document.createDocumentFragment();
      let lastIdx = 0;
      matches.forEach(function (m) {
        if (m.index > lastIdx) {
          frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
        }
        const span = document.createElement('span');
        span.className = 'term-link';
        span.dataset.term = m[0].toLowerCase();
        span.textContent = m[0];
        frag.appendChild(span);
        lastIdx = m.index + m[0].length;
      });
      if (lastIdx < text.length) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx)));
      }
      node.parentNode.replaceChild(frag, node);
    });
  }

  /* ---------- Popover ---------- */

  const popover = document.getElementById('term-popover');

  function showTermPopover(span) {
    const term = span.dataset.term;
    const entry = termMap.get(term);
    if (!entry) return;
    clearChildren(popover);
    const t = document.createElement('span');
    t.className = 'popover-term';
    t.textContent = entry.term;
    const d = document.createElement('span');
    d.className = 'popover-def';
    d.textContent = entry.definition || '';
    popover.appendChild(t);
    popover.appendChild(d);
    const rect = span.getBoundingClientRect();
    popover.hidden = false;
    const popRect = popover.getBoundingClientRect();
    let top = rect.bottom + 8;
    if (top + popRect.height > window.innerHeight - 8) top = rect.top - popRect.height - 8;
    let left = rect.left;
    if (left + popRect.width > window.innerWidth - 8) left = window.innerWidth - popRect.width - 8;
    if (left < 8) left = 8;
    popover.style.top = top + 'px';
    popover.style.left = left + 'px';
  }

  function hideTermPopover() {
    popover.hidden = true;
  }

  /* ---------- Tabs ---------- */

  function wireTabs(rootEl) {
    const containers = rootEl.querySelectorAll('.tabs');
    containers.forEach(function (c) {
      const buttons = c.querySelectorAll('.tab-nav button');
      const panels = c.querySelectorAll('.tab-panel');
      if (!buttons.length || !panels.length) return;
      // Ensure exactly one is active.
      const activeIdx = Math.max(0, Array.prototype.findIndex.call(buttons, function (b) { return b.classList.contains('active'); }));
      buttons.forEach(function (b, idx) {
        b.classList.toggle('active', idx === activeIdx);
        b.addEventListener('click', function () {
          buttons.forEach(function (bb) { bb.classList.remove('active'); });
          b.classList.add('active');
          const target = b.dataset.tab;
          panels.forEach(function (p) {
            p.classList.toggle('hidden', p.dataset.content !== target);
          });
        });
      });
      panels.forEach(function (p, idx) {
        p.classList.toggle('hidden', idx !== activeIdx);
      });
    });
  }

  /* ---------- SVG interactivity ---------- */

  function wireInteractiveSvg(rootEl) {
    const svgs = rootEl.querySelectorAll('svg[data-interactive]');
    svgs.forEach(function (svg) {
      const explainers = svg.querySelectorAll('[data-explain]');
      explainers.forEach(function (el) {
        el.style.cursor = 'help';
        el.addEventListener('mouseenter', function (ev) {
          showSvgTooltip(el.dataset.explain, ev.clientX, ev.clientY);
        });
        el.addEventListener('mouseleave', hideSvgTooltip);
        el.addEventListener('focus', function () {
          const rect = el.getBoundingClientRect();
          showSvgTooltip(el.dataset.explain, rect.left + rect.width / 2, rect.top);
        });
        el.addEventListener('blur', hideSvgTooltip);
        el.setAttribute('tabindex', '0');
      });
    });
  }

  let svgTooltip = null;
  function showSvgTooltip(text, x, y) {
    if (!svgTooltip) {
      svgTooltip = document.createElement('div');
      svgTooltip.className = 'svg-tooltip';
      document.body.appendChild(svgTooltip);
    }
    svgTooltip.textContent = text;
    svgTooltip.style.top = (y + 16) + 'px';
    svgTooltip.style.left = (x + 16) + 'px';
    svgTooltip.style.display = 'block';
  }
  function hideSvgTooltip() {
    if (svgTooltip) svgTooltip.style.display = 'none';
  }

  /* ---------- Progress (localStorage) ---------- */

  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { lastCardIndex: 0, completedCards: {} };
      return JSON.parse(raw);
    } catch (_) {
      return { lastCardIndex: 0, completedCards: {} };
    }
  }

  function saveProgress(p) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch (_) { /* ignore */ }
  }

  const progress = loadProgress();

  function markCardCompleted(idx) {
    progress.completedCards[String(idx)] = true;
    progress.lastCardIndex = idx;
    saveProgress(progress);
    updateChapterNavProgress();
    updateProgressBar();
  }

  function updateChapterNavProgress() {
    const items = document.querySelectorAll('.chapter-link');
    items.forEach(function (item) {
      const chapterNum = parseInt(item.dataset.chapter, 10);
      const chapterCards = cards.filter(function (c) { return c.chapterNum === chapterNum; });
      if (!chapterCards.length) return;
      const completedCount = chapterCards.filter(function (c) {
        const idx = cards.indexOf(c);
        return progress.completedCards[String(idx)];
      }).length;
      item.classList.remove('completed', 'in-progress');
      if (completedCount === chapterCards.length) item.classList.add('completed');
      else if (completedCount > 0) item.classList.add('in-progress');
    });
  }

  function updateProgressBar() {
    const total = cards.length;
    const done = Object.keys(progress.completedCards).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    document.getElementById('progress-fill').style.width = pct + '%';
  }

  /* ---------- Rendering ---------- */

  function renderCurrentCard() {
    const card = cards[currentCardIndex];
    if (!card) return;
    if (!card.renderedHtml) {
      card.renderedHtml = renderMd(card.rawMd);
    }
    const contentEl = document.getElementById('content');
    const meta = '<div class="card-meta" style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:0.5rem;">Chapter ' +
      card.chapterNum + ' · ' + escapeHtml(card.chapterTitle) + ' · Card ' + (card.cardIndex + 1) + ' of ' + card.totalCards + '</div>';
    setHtml(contentEl, '<div class="card-inner">' + meta + card.renderedHtml + '</div>');
    highlightAll(contentEl);
    wrapTerms(contentEl);
    wireInteractiveSvg(contentEl);
    wireTabs(contentEl);

    document.getElementById('prev-card').disabled = currentCardIndex === 0;
    document.getElementById('next-card').disabled = currentCardIndex === cards.length - 1;
    document.getElementById('card-counter').textContent = (currentCardIndex + 1) + ' / ' + cards.length;

    document.querySelectorAll('.chapter-link').forEach(function (el) {
      el.classList.toggle('active', parseInt(el.dataset.chapter, 10) === card.chapterNum);
    });

    contentEl.scrollTop = 0;
    markCardCompleted(currentCardIndex);
  }

  function goToCard(idx) {
    if (idx < 0 || idx >= cards.length) return;
    currentCardIndex = idx;
    renderCurrentCard();
  }

  function nextCard() { goToCard(currentCardIndex + 1); }
  function prevCard() { goToCard(currentCardIndex - 1); }

  function goToChapter(chapterNum) {
    const idx = cards.findIndex(function (c) { return c.chapterNum === chapterNum; });
    if (idx !== -1) goToCard(idx);
  }

  /* ---------- Glossary panel ---------- */

  function renderGlossary() {
    const ul = document.getElementById('glossary-list');
    if (!ul) return;
    clearChildren(ul);
    if (!termLedger.length) {
      const li = document.createElement('li');
      li.className = 'glossary-item';
      li.style.color = 'var(--color-text-muted)';
      li.textContent = 'No terms defined yet.';
      ul.appendChild(li);
      return;
    }
    const sorted = termLedger.slice().sort(function (a, b) { return a.term.localeCompare(b.term); });
    sorted.forEach(function (t) {
      const li = document.createElement('li');
      li.className = 'glossary-item';
      const term = document.createElement('div');
      term.className = 'glossary-term';
      term.textContent = t.term;
      const def = document.createElement('div');
      def.className = 'glossary-def';
      def.textContent = t.definition || '';
      li.appendChild(term);
      li.appendChild(def);
      ul.appendChild(li);
    });
  }

  function renderResources() {
    const el = document.getElementById('resources-content');
    if (!el || !resourcesData) return;
    clearChildren(el);

    function makeLink(href, text) {
      const a = document.createElement('a');
      a.href = href;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = text;
      return a;
    }

    if (Array.isArray(resourcesData.sources) && resourcesData.sources.length) {
      const h = document.createElement('h4');
      h.textContent = 'Sources';
      el.appendChild(h);
      resourcesData.sources.forEach(function (s) {
        const p = document.createElement('p');
        if (s.type) {
          const tag = document.createElement('small');
          tag.style.color = 'var(--color-text-muted)';
          tag.textContent = '[' + s.type + '] ';
          p.appendChild(tag);
        }
        p.appendChild(makeLink(s.url, s.title || s.url));
        if (s.why) {
          p.appendChild(document.createElement('br'));
          const why = document.createElement('small');
          why.textContent = s.why;
          p.appendChild(why);
        }
        el.appendChild(p);
      });
    }
    if (Array.isArray(resourcesData.influencers) && resourcesData.influencers.length) {
      const h = document.createElement('h4');
      h.textContent = 'Influencers';
      el.appendChild(h);
      resourcesData.influencers.forEach(function (i) {
        const p = document.createElement('p');
        const a = makeLink(i.url, '');
        const strong = document.createElement('strong');
        strong.textContent = i.name;
        a.appendChild(strong);
        p.appendChild(a);
        if (i.signature) {
          p.appendChild(document.createTextNode(' · '));
          p.appendChild(makeLink(i.signature, 'signature post'));
        }
        if (i.why) {
          p.appendChild(document.createElement('br'));
          const why = document.createElement('small');
          why.textContent = i.why;
          p.appendChild(why);
        }
        el.appendChild(p);
      });
    }
    if (!el.firstChild) {
      const p = document.createElement('p');
      p.style.color = 'var(--color-text-muted)';
      p.textContent = 'No resources listed.';
      el.appendChild(p);
    }
  }

  /* ---------- Theme ---------- */

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-system-theme', prefersDark ? 'dark' : 'light');
    } else {
      document.documentElement.removeAttribute('data-system-theme');
    }
    try { localStorage.setItem('teach-me:theme', theme); } catch (_) { /* ignore */ }
  }

  function cycleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'auto';
    const next = current === 'light' ? 'dark' : current === 'dark' ? 'auto' : 'light';
    applyTheme(next);
  }

  /* ---------- Search ---------- */

  let searchTimer = null;

  function runSearch(query) {
    const resultsEl = document.getElementById('search-results');
    clearChildren(resultsEl);
    if (!query || query.length < 2) {
      resultsEl.hidden = true;
      return;
    }
    const q = query.toLowerCase();
    const matches = [];
    for (let idx = 0; idx < cards.length && matches.length < 12; idx++) {
      const card = cards[idx];
      const lower = card.rawMd.toLowerCase();
      const pos = lower.indexOf(q);
      if (pos === -1) continue;
      const start = Math.max(0, pos - 30);
      const end = Math.min(card.rawMd.length, pos + q.length + 60);
      const snippet = card.rawMd.slice(start, end).replace(/\s+/g, ' ').trim();
      matches.push({
        idx: idx,
        chapterNum: card.chapterNum,
        chapterTitle: card.chapterTitle,
        cardIndex: card.cardIndex,
        totalCards: card.totalCards,
        snippet: snippet,
        query: q,
      });
    }
    if (!matches.length) {
      const div = document.createElement('div');
      div.style.padding = '0.5rem';
      div.style.color = 'var(--color-text-muted)';
      div.textContent = 'No matches.';
      resultsEl.appendChild(div);
      resultsEl.hidden = false;
      return;
    }
    matches.forEach(function (m) {
      const a = document.createElement('a');
      a.className = 'search-result';
      a.dataset.card = String(m.idx);
      a.href = '#';
      const header = document.createElement('strong');
      header.textContent = 'Ch ' + m.chapterNum + ' · ' + m.chapterTitle;
      a.appendChild(header);
      a.appendChild(document.createTextNode(' · Card ' + (m.cardIndex + 1) + '/' + m.totalCards));
      const sn = document.createElement('div');
      sn.className = 'match-snippet';
      const lowerSnip = m.snippet.toLowerCase();
      const qpos = lowerSnip.indexOf(m.query);
      if (qpos !== -1) {
        sn.appendChild(document.createTextNode(m.snippet.slice(0, qpos)));
        const mark = document.createElement('mark');
        mark.textContent = m.snippet.slice(qpos, qpos + m.query.length);
        sn.appendChild(mark);
        sn.appendChild(document.createTextNode(m.snippet.slice(qpos + m.query.length)));
      } else {
        sn.textContent = m.snippet;
      }
      a.appendChild(sn);
      resultsEl.appendChild(a);
    });
    resultsEl.hidden = false;
  }

  /* ---------- Wiring ---------- */

  function wireEvents() {
    document.getElementById('next-card').addEventListener('click', nextCard);
    document.getElementById('prev-card').addEventListener('click', prevCard);

    document.querySelectorAll('.chapter-link').forEach(function (el) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        goToChapter(parseInt(el.dataset.chapter, 10));
      });
    });

    document.getElementById('theme-toggle').addEventListener('click', cycleTheme);

    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function () {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function () { runSearch(searchInput.value); }, 120);
    });
    searchInput.addEventListener('blur', function () {
      setTimeout(function () {
        document.getElementById('search-results').hidden = true;
      }, 200);
    });

    document.getElementById('search-results').addEventListener('click', function (ev) {
      const a = ev.target.closest('.search-result');
      if (!a) return;
      ev.preventDefault();
      const idx = parseInt(a.dataset.card, 10);
      if (!isNaN(idx)) {
        goToCard(idx);
        searchInput.value = '';
        document.getElementById('search-results').hidden = true;
      }
    });

    document.addEventListener('keydown', function (ev) {
      if (ev.target && (ev.target.tagName === 'INPUT' || ev.target.tagName === 'TEXTAREA')) return;
      if (ev.key === 'ArrowRight' || ev.key === 'j') { nextCard(); ev.preventDefault(); }
      else if (ev.key === 'ArrowLeft' || ev.key === 'k') { prevCard(); ev.preventDefault(); }
    });

    document.body.addEventListener('mouseover', function (ev) {
      const span = ev.target.closest('.term-link');
      if (span) showTermPopover(span);
    });
    document.body.addEventListener('mouseout', function (ev) {
      if (ev.target.closest('.term-link')) hideTermPopover();
    });

    if (window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) {
        mq.addEventListener('change', function () {
          if ((document.documentElement.getAttribute('data-theme') || 'auto') === 'auto') {
            applyTheme('auto');
          }
        });
      }
    }
  }

  /* ---------- Init ---------- */

  function init() {
    let savedTheme = 'auto';
    try { savedTheme = localStorage.getItem('teach-me:theme') || 'auto'; } catch (_) { /* ignore */ }
    applyTheme(savedTheme);

    buildCards();
    renderGlossary();
    renderResources();
    updateChapterNavProgress();
    updateProgressBar();
    wireEvents();

    if (cards.length) {
      const resumeAt = Math.min(progress.lastCardIndex || 0, cards.length - 1);
      goToCard(resumeAt);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
