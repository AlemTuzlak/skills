import { create } from 'zustand'
import { slides, talk } from './talk.js'

function clampIndex(index) {
  return Math.max(0, Math.min(slides.length - 1, index))
}

function maxStep(index) {
  return Math.max(1, slides[index]?.steps ?? 1) - 1
}

function slideIndexById(id) {
  const i = slides.findIndex((s) => s.id === id)
  return i >= 0 ? i : 0
}

function writeUrl(index) {
  const params = new URLSearchParams(window.location.search)
  params.set('slide', slides[index].id)
  const query = params.toString()
  const next = `${window.location.pathname}?${query}`
  window.history.replaceState(null, '', next)
}

export const useTalk = create((set, get) => ({
  index: 0,
  step: 0,
  slides,
  talk,
  timerVisible: false,
  timerRunning: false,
  timerStartedAt: 0,
  timerFrozenMs: 0,

  goTo(index, step = 0) {
    const i = clampIndex(index)
    const s = Math.max(0, Math.min(maxStep(i), step))
    set({ index: i, step: s })
    writeUrl(i)
  },

  nextSlide() {
    const { index } = get()
    if (index < slides.length - 1) get().goTo(index + 1, 0)
  },

  prevSlide() {
    const { index } = get()
    if (index > 0) get().goTo(index - 1, 0)
  },

  nextStep() {
    const { index, step } = get()
    const cap = maxStep(index)
    if (step < cap) set({ step: step + 1 })
  },

  prevStep() {
    const { step } = get()
    if (step > 0) set({ step: step - 1 })
  },

  bootFromUrl() {
    const params = new URLSearchParams(window.location.search)
    const id = params.get('slide')
    if (id) get().goTo(slideIndexById(id), 0)
  },

  isFlat() {
    const params = new URLSearchParams(window.location.search)
    return params.get('flat') === '1' || params.get('flat') === 'true'
  },

  toggleTimer() {
    if (!talk.timer) return
    const state = get()
    if (state.timerRunning) {
      set({
        timerRunning: false,
        timerVisible: true,
        timerFrozenMs: performance.now() - state.timerStartedAt,
      })
      return
    }
    set({
      timerVisible: true,
      timerRunning: true,
      timerStartedAt: performance.now(),
      timerFrozenMs: 0,
    })
  },
}))
