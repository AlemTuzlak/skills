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
  let currentView = 'card'; // 'card' | 'glossary' | 'resources'

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

  function deriveCardLabel(rawMd, cardIndex) {
    const m = rawMd.match(/^##\s+(.+)$/m);
    if (!m) return 'Card ' + (cardIndex + 1);
    const heading = m[1].trim();
    if (/^What you'll learn/i.test(heading)) return 'Intro & prereqs';
    if (/^Prereq/i.test(heading)) return 'Prereq check';
    const cardMatch = heading.match(/^Card\s+(\d+)\s*:\s*(.+)$/i);
    if (cardMatch) return cardMatch[1] + '. ' + cardMatch[2];
    if (/^Recall/i.test(heading)) return 'Recall & recap';
    if (/^Recap/i.test(heading)) return 'Recap';
    if (/^Next/i.test(heading)) return 'Next';
    return heading;
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
          label: deriveCardLabel(rawMd, idx),
        });
      });
    });
    cards.sort(function (a, b) {
      if (a.chapterNum !== b.chapterNum) return a.chapterNum - b.chapterNum;
      return a.cardIndex - b.cardIndex;
    });
  }

  function rebuildSidebarNav() {
    const list = document.getElementById('chapter-list');
    if (!list) return;
    clearChildren(list);

    const byChapter = new Map();
    cards.forEach(function (c, idx) {
      if (!byChapter.has(c.chapterNum)) byChapter.set(c.chapterNum, []);
      byChapter.get(c.chapterNum).push({ card: c, globalIdx: idx });
    });

    (courseMeta.chapters || []).forEach(function (chMeta) {
      const chNum = chMeta.number;
      const chCards = byChapter.get(chNum) || [];

      const item = document.createElement('li');
      item.className = 'chapter-item';
      item.dataset.chapter = String(chNum);

      const a = document.createElement('a');
      a.className = 'chapter-link';
      a.href = '#';
      a.dataset.chapter = String(chNum);

      const num = document.createElement('span');
      num.className = 'chapter-number';
      num.textContent = String(chNum);
      a.appendChild(num);

      const title = document.createElement('span');
      title.className = 'chapter-title';
      title.textContent = chMeta.title || ('Chapter ' + chNum);
      a.appendChild(title);

      item.appendChild(a);

      if (chCards.length > 0) {
        const sub = document.createElement('ol');
        sub.className = 'card-list';
        chCards.forEach(function (entry) {
          const li = document.createElement('li');
          li.className = 'card-list-item';
          const cardA = document.createElement('a');
          cardA.className = 'card-link';
          cardA.href = '#';
          cardA.dataset.cardIdx = String(entry.globalIdx);
          cardA.textContent = entry.card.label;
          li.appendChild(cardA);
          sub.appendChild(li);
        });
        item.appendChild(sub);
      }

      list.appendChild(item);
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
    currentView = 'card';
    setActiveExtras(null);
    const card = cards[currentCardIndex];
    if (!card) return;
    if (!card.renderedHtml) {
      card.renderedHtml = renderMd(card.rawMd);
    }
    const contentEl = document.getElementById('content');
    const meta = '<div class="card-meta" style="color:var(--color-text-muted);font-size:0.85rem;margin-bottom:0.5rem;">Chapter ' +
      card.chapterNum + ' · ' + escapeHtml(card.chapterTitle) + ' · Card ' + (card.cardIndex + 1) + ' of ' + card.totalCards + '</div>';
    setHtml(contentEl, '<div class="card card-inner">' + meta + card.renderedHtml + '</div>');
    highlightAll(contentEl);
    wrapTerms(contentEl);
    wireInteractiveSvg(contentEl);
    wireTabs(contentEl);

    document.getElementById('prev-card').disabled = currentCardIndex === 0;
    document.getElementById('next-card').disabled = currentCardIndex === cards.length - 1;
    document.getElementById('card-counter').textContent = (currentCardIndex + 1) + ' / ' + cards.length;

    document.querySelectorAll('.chapter-item').forEach(function (item) {
      const isActive = parseInt(item.dataset.chapter, 10) === card.chapterNum;
      item.classList.toggle('expanded', isActive);
      const link = item.querySelector('.chapter-link');
      if (link) link.classList.toggle('active', isActive);
    });
    document.querySelectorAll('.card-link').forEach(function (el) {
      const idx = parseInt(el.dataset.cardIdx, 10);
      el.classList.toggle('active', idx === currentCardIndex);
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

  /* ---------- Reference views (Glossary, Resources) ---------- */

  function termSourceChapter(t) {
    return t['first-use-chapter'] || t.firstUseChapter || t.chapter || null;
  }

  function findChapterMeta(num) {
    if (!num) return null;
    return (courseMeta.chapters || []).find(function (c) { return c.number === num; }) || null;
  }

  function renderGlossaryView() {
    currentView = 'glossary';
    const contentEl = document.getElementById('content');
    const sorted = termLedger.slice().sort(function (a, b) { return a.term.localeCompare(b.term); });

    const head = '<div class="card card-inner view-screen">' +
      '<h1 class="view-title">📖 Glossary</h1>' +
      '<p class="view-subtitle">' + sorted.length + ' terms defined across the course. Click any chapter link to jump to where the term was first introduced.</p>' +
      '<input class="view-filter" id="glossary-filter" type="search" placeholder="Filter terms or definitions…" aria-label="Filter glossary" autocomplete="off" />' +
      '<ol class="glossary-card-list" id="glossary-card-list">';

    let items = '';
    if (!sorted.length) {
      items = '<li class="glossary-card-empty">No glossary terms have been recorded yet.</li>';
    } else {
      items = sorted.map(function (t) {
        const ch = termSourceChapter(t);
        const chMeta = findChapterMeta(ch);
        const srcLink = chMeta
          ? '<p class="glossary-term-source">First defined in <a href="#" class="glossary-source-link" data-chapter="' + chMeta.number + '">Chapter ' + chMeta.number + ': ' + escapeHtml(chMeta.title) + '</a></p>'
          : '';
        const initial = (t.term || '').charAt(0).toUpperCase();
        return '<li class="glossary-card-item" data-search-term="' + escapeHtml((t.term + ' ' + (t.definition || '')).toLowerCase()) + '">' +
          '<div class="glossary-term-head"><span class="glossary-initial">' + escapeHtml(initial) + '</span><h3>' + escapeHtml(t.term) + '</h3></div>' +
          '<p class="glossary-term-def">' + escapeHtml(t.definition || '') + '</p>' +
          srcLink +
          '</li>';
      }).join('');
    }
    const tail = '</ol></div>';
    setHtml(contentEl, head + items + tail);

    const filterEl = document.getElementById('glossary-filter');
    if (filterEl) {
      filterEl.addEventListener('input', function () {
        const q = (filterEl.value || '').toLowerCase().trim();
        const lis = document.querySelectorAll('.glossary-card-item');
        let visible = 0;
        lis.forEach(function (li) {
          const hay = li.dataset.searchTerm || '';
          const match = !q || hay.indexOf(q) !== -1;
          li.style.display = match ? '' : 'none';
          if (match) visible++;
        });
        const emptyEl = document.getElementById('glossary-empty-state');
        if (emptyEl) emptyEl.remove();
        if (visible === 0 && q) {
          const ol = document.getElementById('glossary-card-list');
          if (ol) {
            const li = document.createElement('li');
            li.id = 'glossary-empty-state';
            li.className = 'glossary-card-empty';
            li.textContent = 'No terms match "' + q + '".';
            ol.appendChild(li);
          }
        }
      });
    }

    setActiveExtras('glossary');
    document.querySelectorAll('.chapter-link, .card-link').forEach(function (el) { el.classList.remove('active'); });
    document.querySelectorAll('.chapter-item').forEach(function (el) { el.classList.remove('expanded'); });
    document.getElementById('prev-card').disabled = true;
    document.getElementById('next-card').disabled = true;
    document.getElementById('card-counter').textContent = sorted.length + ' terms';
    contentEl.scrollTop = 0;
  }

  function renderResourcesView() {
    currentView = 'resources';
    const contentEl = document.getElementById('content');
    const sources = (resourcesData && Array.isArray(resourcesData.sources)) ? resourcesData.sources : [];
    const influencers = (resourcesData && Array.isArray(resourcesData.influencers)) ? resourcesData.influencers : [];

    function renderSourceCard(s) {
      const tag = s.type ? '<span class="resource-tag">' + escapeHtml(s.type) + '</span>' : '';
      const title = escapeHtml(s.title || s.url);
      const why = s.why ? '<p class="resource-why">' + escapeHtml(s.why) + '</p>' : '';
      return '<li class="resource-card">' +
        '<p class="resource-title">' + tag + '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noopener">' + title + '</a></p>' +
        why +
        '</li>';
    }

    function renderInfluencerCard(i) {
      const main = '<a href="' + escapeHtml(i.url || '#') + '" target="_blank" rel="noopener"><strong>' + escapeHtml(i.name || '') + '</strong></a>';
      const sig = i.signature ? ' · <a href="' + escapeHtml(i.signature) + '" target="_blank" rel="noopener">signature post</a>' : '';
      const why = i.why ? '<p class="resource-why">' + escapeHtml(i.why) + '</p>' : '';
      return '<li class="resource-card resource-card-influencer">' +
        '<p class="resource-title">' + main + sig + '</p>' +
        why +
        '</li>';
    }

    const head = '<div class="card card-inner view-screen">' +
      '<h1 class="view-title">📚 Resources</h1>' +
      '<p class="view-subtitle">Sources cited across the chapters and niche practitioners worth following.</p>';

    let body = '';
    if (sources.length) {
      body += '<section class="resources-section-view"><h2>Sources (' + sources.length + ')</h2><ol class="resources-list">' +
        sources.map(renderSourceCard).join('') + '</ol></section>';
    }
    if (influencers.length) {
      body += '<section class="resources-section-view"><h2>Niche influencers (' + influencers.length + ')</h2><ol class="resources-list">' +
        influencers.map(renderInfluencerCard).join('') + '</ol></section>';
    }
    if (!sources.length && !influencers.length) {
      body += '<p style="color:var(--color-text-muted);">No resources recorded for this course.</p>';
    }
    const tail = '</div>';
    setHtml(contentEl, head + body + tail);

    setActiveExtras('resources');
    document.querySelectorAll('.chapter-link, .card-link').forEach(function (el) { el.classList.remove('active'); });
    document.querySelectorAll('.chapter-item').forEach(function (el) { el.classList.remove('expanded'); });
    document.getElementById('prev-card').disabled = true;
    document.getElementById('next-card').disabled = true;
    document.getElementById('card-counter').textContent = (sources.length + influencers.length) + ' resources';
    contentEl.scrollTop = 0;
  }

  function setActiveExtras(viewName) {
    document.querySelectorAll('.extras-link').forEach(function (el) {
      el.classList.toggle('active', el.dataset.view === viewName);
    });
  }

  function setExtrasCounts() {
    const g = document.getElementById('extras-count-glossary');
    if (g) g.textContent = termLedger.length ? termLedger.length : '';
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

    document.getElementById('chapter-list').addEventListener('click', function (ev) {
      const cardLink = ev.target.closest('.card-link');
      if (cardLink) {
        ev.preventDefault();
        const idx = parseInt(cardLink.dataset.cardIdx, 10);
        if (!isNaN(idx)) goToCard(idx);
        return;
      }
      const chapterLink = ev.target.closest('.chapter-link');
      if (chapterLink) {
        ev.preventDefault();
        goToChapter(parseInt(chapterLink.dataset.chapter, 10));
      }
    });

    document.querySelectorAll('.extras-link').forEach(function (el) {
      el.addEventListener('click', function (ev) {
        ev.preventDefault();
        const view = el.dataset.view;
        if (view === 'glossary') renderGlossaryView();
        else if (view === 'resources') renderResourcesView();
      });
    });

    document.body.addEventListener('click', function (ev) {
      const src = ev.target.closest('.glossary-source-link');
      if (src) {
        ev.preventDefault();
        const ch = parseInt(src.dataset.chapter, 10);
        if (!isNaN(ch)) goToChapter(ch);
      }
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
      if (currentView !== 'card') return;
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
    rebuildSidebarNav();
    setExtrasCounts();
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
