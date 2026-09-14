export function bindNav(api) {
  function onKey(event) {
    const key = event.key
    if (key === ' ') {
      event.preventDefault()
      return
    }
    if (event.repeat) return
    if (key === 'ArrowRight' || key === 'ArrowDown' || key === 'PageDown') {
      event.preventDefault()
      api.getState().nextSlide()
      return
    }
    if (key === 'ArrowLeft' || key === 'ArrowUp' || key === 'PageUp') {
      event.preventDefault()
      api.getState().prevSlide()
      return
    }
    if (key === 'Enter') {
      event.preventDefault()
      api.getState().nextStep()
      return
    }
    if (key === 'Backspace') {
      event.preventDefault()
      api.getState().prevStep()
      return
    }
    if (key === 'f' || key === 'F') {
      event.preventDefault()
      if (!document.fullscreenElement) document.documentElement.requestFullscreen()
      else document.exitFullscreen()
      return
    }
    if (key === 't' || key === 'T') {
      event.preventDefault()
      api.getState().toggleTimer()
    }
  }

  window.addEventListener('keydown', onKey)
  return () => window.removeEventListener('keydown', onKey)
}
