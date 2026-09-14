import { useEffect, useState } from 'react'
import { useTalk } from '../store.js'

function formatMs(ms) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = String(Math.floor(total / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${m}:${s}`
}

export function Hud() {
  const index = useTalk((s) => s.index)
  const total = useTalk((s) => s.slides.length)
  const talk = useTalk((s) => s.talk)
  const timerVisible = useTalk((s) => s.timerVisible)
  const timerRunning = useTalk((s) => s.timerRunning)
  const timerStartedAt = useTalk((s) => s.timerStartedAt)
  const timerFrozenMs = useTalk((s) => s.timerFrozenMs)
  const [now, setNow] = useState(() => performance.now())

  useEffect(() => {
    if (!timerRunning) return undefined
    let frame = 0
    const tick = (t) => {
      setNow(t)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [timerRunning])

  const elapsed = timerRunning ? now - timerStartedAt : timerFrozenMs
  const budgetMs = (talk.durationMinutes || 0) * 60 * 1000
  const overtime = budgetMs > 0 && elapsed > budgetMs

  return (
    <div className="hud">
      <div className="hud-counter">
        {index + 1} / {total}
      </div>
      {talk.timer && timerVisible ? (
        <div className={overtime ? 'hud-timer is-over' : 'hud-timer'}>
          {formatMs(elapsed)}
        </div>
      ) : null}
    </div>
  )
}
