# Component library — /teach-me

The viewer ships with a small library of reusable components. Most are pure HTML/CSS, a few have JS wiring. Some are auto-generated from markdown conventions (callouts, diagram cards), the rest you reach for explicitly with raw HTML inside your markdown.

## Auto-generated (no work needed)

### Callouts

Use either GitHub-flavored alert syntax OR the legacy `**Label**:` pattern. The build script transforms both into styled `<aside class="callout callout-X">` blocks.

**GFM alert syntax (recommended for new chapters):**

```markdown
> [!NOTE]
> A neutral note.

> [!TIP]
> A useful pointer.

> [!IMPORTANT]
> Something the reader must not miss.

> [!WARNING]
> A potential gotcha.

> [!CAUTION]
> A serious foot-gun.

> [!INSIGHT]
> A key takeaway worth pausing on.

> [!ANALOGY]
> An analogy to a known domain.

> [!BREAKDOWN]
> Where the analogy breaks down.

> [!QUOTE]
> A cited source quote.

> [!HISTORY]
> A war story / origin / production incident.
```

**Legacy patterns (still supported):**

```markdown
> **Self-explain**: Finish this sentence — ...
> 
> <details><summary>Sample answer</summary>...</details>
```

The first line `**Self-explain**:` triggers the `callout-self-explain` style. Same for `**Analogy**:`, `**Where this breaks down**:`, `**Note**:`, `**Tip**:`, `**Warning**:`, etc.

### Diagram cards

Any markdown image followed by an optional italic caption is auto-wrapped in a `<figure class="diagram-card">`:

```markdown
![alt text](./diagrams/chNN-name.svg)
*Caption text here.*
```

becomes

```html
<figure class="diagram-card">
  <img src="./diagrams/chNN-name.svg" alt="alt text" loading="lazy">
  <figcaption>Caption text here.</figcaption>
</figure>
```

The card has a near-white background in both light and dark themes, so the diagram's dark strokes (`#1f2937`) stay readable. No work needed from chapter writers.

## Explicit components (use raw HTML inside markdown)

### Info card

For a small bordered box with a heading and content.

```markdown
<div class="info-card">

#### Did you know

Workflow engines can checkpoint memory directly to disk, skipping replay entirely.

</div>
```

**Note**: in marked.js, raw `<div>` blocks need a blank line after the opening tag and before the closing tag to allow markdown parsing inside.

### Definition card

For a highlighted term definition.

```html
<aside class="def">
  <dfn>Saga</dfn> — A sequence of local transactions paired with compensating actions, used as a non-blocking alternative to distributed two-phase commit.
</aside>
```

### Stat card

For numeric callouts.

```html
<aside class="stat">
  <strong>50,000</strong>
  <span>events — Temporal's default workflow-history size limit</span>
</aside>
```

### Compare card (side-by-side)

For Don't / Do or Before / After or Bad / Good comparisons.

```markdown
<div class="compare">
  <aside class="compare-bad">

#### ❌ Don't

\`\`\`ts
const id = Math.random();
\`\`\`

  </aside>
  <aside class="compare-good">

#### ✅ Do

\`\`\`ts
const id = workflow.uuid4();
\`\`\`

  </aside>
</div>
```

The two columns stack on mobile.

### Tabs (interactive)

For showing the same concept across multiple platforms or languages.

```markdown
<div class="tabs">
  <nav class="tab-nav">
    <button data-tab="temporal" class="active">Temporal</button>
    <button data-tab="trigger">trigger.dev</button>
    <button data-tab="inngest">Inngest</button>
  </nav>
  <div class="tab-panel" data-content="temporal">

\`\`\`ts
// Temporal example
\`\`\`

  </div>
  <div class="tab-panel" data-content="trigger">

\`\`\`ts
// trigger.dev example
\`\`\`

  </div>
  <div class="tab-panel" data-content="inngest">

\`\`\`ts
// Inngest example
\`\`\`

  </div>
</div>
```

The viewer wires up click handlers on tab buttons automatically.

### Pills / tags

Inline label chips.

```markdown
This source is <span class="tag tag-blue">[official]</span> and worth bookmarking.
```

Variants: `tag-blue`, `tag-green`, `tag-amber`, `tag-red`, `tag-purple`, or no modifier for a neutral chip.

### Platform pill

Color-coded chip per workflow platform, useful in comparison tables and prose.

```markdown
You'd reach for <span class="platform-pill" data-platform="temporal">Temporal</span> when polyglot SDKs matter, but <span class="platform-pill" data-platform="trigger">trigger.dev</span> when you want a TS-first managed option.
```

Supported `data-platform` values: `temporal`, `trigger`, `inngest`, `restate`, `step-functions`, `dbos`.

### Step list

Numbered list with prominent badges per step. Use for ordered procedures.

```html
<ol class="step-list">
  <li>Describe what should happen.</li>
  <li>Identify the side effects.</li>
  <li>Wrap each side effect in <code>step.run</code>.</li>
  <li>Add idempotency keys to downstream calls.</li>
</ol>
```

### Keyboard keys

For shortcuts. Inline.

```markdown
Press <kbd>→</kbd> or <kbd>j</kbd> to advance to the next card.
```

## Native `<details>` elements

All click-to-reveal patterns use HTML5's `<details>` / `<summary>`. No special class needed — the viewer's base styles apply automatically.

```markdown
<details>
<summary>Click me</summary>

Hidden content here, parsed as markdown.

</details>
```

## Component selection cheat sheet

| Need | Component |
|------|-----------|
| Highlight a key insight | `> [!INSIGHT]` callout |
| Warn about a footgun | `> [!WARNING]` callout |
| State an analogy | `> [!ANALOGY]` callout + `> [!BREAKDOWN]` disclaimer |
| Show a self-explain prompt | `> **Self-explain**:` (auto-styled) |
| Wrap a diagram nicely | Just write `![alt](./diagrams/...)` followed by `*caption*` |
| Define a key term inline | `<aside class="def">` |
| Highlight a number / limit | `<aside class="stat">` |
| Compare bad vs good code | `<div class="compare">` |
| Show same idea across platforms | `<div class="tabs">` |
| Mark a source type | `<span class="tag tag-blue">` |
| Reference a workflow platform | `<span class="platform-pill" data-platform="...">` |
| Numbered procedure | `<ol class="step-list">` |
| Show / hide an answer | Native `<details>` |

## Theming

All components respect `data-theme` (light / dark / auto). Diagram cards stay light-backgrounded in both themes by design — the SVG strokes are dark and need a light surface to read clearly. If you need a component that adapts colors per theme, use the CSS variables defined at the top of `styles.css` (`--color-bg-alt`, `--color-border`, `--color-primary`, etc.).

## Adding a new component

1. Add CSS to `styles.css` under the `Component library` section.
2. If the component needs interactivity, wire it in `viewer.js` (call your `wireMyThing(rootEl)` from `renderCurrentCard` alongside `wireTabs`).
3. If chapter authors should write it via markdown convention, add a transform pass in `build-html.mjs`.
4. Document it here in `COMPONENTS.md`.
5. Add a one-line entry in the cheat sheet table.
