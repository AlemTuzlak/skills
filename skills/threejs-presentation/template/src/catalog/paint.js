const W = 1920
const H = 1080

function fill(ctx, theme) {
  ctx.fillStyle = theme.bg
  ctx.fillRect(0, 0, W, H)
}

function setFont(ctx, size, weight = '600') {
  ctx.font = `${weight} ${size}px ui-sans-serif, system-ui, sans-serif`
}

function wrap(ctx, text, maxWidth) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

function paintTitle(ctx, slide, theme) {
  fill(ctx, theme)
  ctx.fillStyle = theme.accent
  setFont(ctx, 36, '500')
  ctx.fillText(slide.kicker || '', 160, 280)
  ctx.fillStyle = theme.ink
  setFont(ctx, 92, '700')
  const lines = wrap(ctx, slide.title, W - 320)
  lines.forEach((line, i) => ctx.fillText(line, 160, 420 + i * 110))
}

function paintStatement(ctx, slide, theme) {
  fill(ctx, theme)
  ctx.fillStyle = theme.ink
  setFont(ctx, 84, '700')
  const lines = wrap(ctx, slide.title, W - 280)
  const top = (H - lines.length * 100) / 2
  lines.forEach((line, i) => ctx.fillText(line, 140, top + i * 100))
}

function paintQuote(ctx, slide, theme) {
  fill(ctx, theme)
  ctx.fillStyle = theme.ink
  setFont(ctx, 64, '600')
  const lines = wrap(ctx, `"${slide.quote || ''}"`, W - 320)
  lines.forEach((line, i) => ctx.fillText(line, 160, 360 + i * 84))
  ctx.fillStyle = theme.muted
  setFont(ctx, 32, '500')
  ctx.fillText(slide.attribution || '', 160, 360 + lines.length * 84 + 48)
}

function paintChart(ctx, slide, theme, step) {
  fill(ctx, theme)
  ctx.fillStyle = theme.ink
  setFont(ctx, 48, '700')
  ctx.fillText(slide.title || '', 160, 160)
  const bars = slide.bars || []
  const shown = bars.slice(0, step + 1)
  const max = Math.max(1, ...bars.map((b) => b.value))
  const slot = (W - 320) / Math.max(1, bars.length)
  shown.forEach((bar, i) => {
    const h = (bar.value / max) * 620
    const x = 160 + i * slot
    const y = 900 - h
    ctx.fillStyle = theme.accent
    ctx.fillRect(x, y, slot * 0.55, h)
    ctx.fillStyle = theme.muted
    setFont(ctx, 28, '500')
    ctx.fillText(bar.label, x, 960)
  })
}

function paintCode(ctx, slide, theme) {
  fill(ctx, theme)
  ctx.fillStyle = theme.ink
  setFont(ctx, 40, '700')
  ctx.fillText(slide.title || '', 160, 140)
  const lines = (slide.lines || []).slice(0, 7)
  const highlight = new Set(slide.highlight || [])
  lines.forEach((line, i) => {
    const y = 260 + i * 92
    ctx.fillStyle = highlight.size === 0 || highlight.has(i) ? theme.ink : theme.muted
    ctx.font = `500 36px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`
    ctx.fillText(line, 180, y)
  })
}

function paintImage(ctx, slide, theme) {
  fill(ctx, theme)
  ctx.fillStyle = theme.muted
  setFont(ctx, 32, '500')
  ctx.fillText(slide.caption || 'ASSET NEEDED', 160, 200)
  ctx.strokeStyle = theme.muted
  ctx.strokeRect(160, 240, W - 320, 680)
  ctx.fillStyle = theme.ink
  setFont(ctx, 40, '600')
  ctx.fillText(slide.title || '', 180, 300)
  if (slide._image) {
    ctx.drawImage(slide._image, 160, 240, W - 320, 680)
  }
}

function paintPunch(ctx, slide, theme) {
  ctx.fillStyle = theme.bg
  ctx.globalAlpha = 0.35
  ctx.fillRect(0, 0, W, H)
  ctx.globalAlpha = 1
  if (slide.title) {
    ctx.fillStyle = theme.muted
    setFont(ctx, 42, '500')
    ctx.fillText(slide.title, 160, 540)
  }
}

export function paint(canvas, slide, step, theme) {
  const ctx = canvas.getContext('2d')
  ctx.save()
  ctx.clearRect(0, 0, W, H)
  const form = slide?.form || 'statement'
  if (form === 'title') paintTitle(ctx, slide, theme)
  else if (form === 'quote') paintQuote(ctx, slide, theme)
  else if (form === 'chart') paintChart(ctx, slide, theme, step)
  else if (form === 'code') paintCode(ctx, slide, theme)
  else if (form === 'image') paintImage(ctx, slide, theme)
  else if (form === 'punch') paintPunch(ctx, slide, theme)
  else paintStatement(ctx, slide, theme)
  ctx.restore()
}

export const CANVAS_SIZE = { w: W, h: H }
