import { useEffect, useRef } from 'react'
import { useTalk } from '../store.js'
import { paint, CANVAS_SIZE } from '../catalog/paint.js'

export function FlatView() {
  const canvasRef = useRef(null)
  const slide = useTalk((s) => s.slides[s.index])
  const step = useTalk((s) => s.step)
  const theme = useTalk((s) => s.talk.theme)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = CANVAS_SIZE.w
    canvas.height = CANVAS_SIZE.h
    paint(canvas, slide, step, theme)
  }, [slide, step, theme])

  return (
    <div className="flat-root">
      <canvas ref={canvasRef} />
    </div>
  )
}
