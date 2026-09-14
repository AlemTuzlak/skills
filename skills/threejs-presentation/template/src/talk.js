export const talk = {
  timer: true,
  durationMinutes: 20,
  theme: {
    bg: '#0b0b0c',
    ink: '#f4f1ea',
    accent: '#c8ff00',
    muted: '#8a867c',
  },
}

export const slides = [
  {
    id: 'title',
    camera: { position: [0, 1.6, 3.4], lookAt: [0, 1.4, 0] },
    form: 'title',
    kicker: 'Replace this world',
    title: 'Your assertion is the title',
    steps: 1,
    notes: 'Hook in 10 to 15 seconds. Do not introduce yourself first.',
  },
  {
    id: 'claim',
    camera: { position: [0.15, 1.55, 2.6], lookAt: [0, 1.4, 0] },
    form: 'statement',
    title: 'One idea fills the glass',
    steps: 1,
    notes: 'Say the evidence. It is not on the glass.',
  },
  {
    id: 'chart',
    camera: { position: [0, 1.5, 2.8], lookAt: [0, 1.4, 0] },
    form: 'chart',
    title: 'Name the takeaway, not the axes',
    bars: [
      { label: 'A', value: 40 },
      { label: 'B', value: 70 },
      { label: 'C', value: 55 },
    ],
    steps: 3,
    notes: 'Enter reveals one bar at a time.',
  },
  {
    id: 'code',
    camera: { position: [-0.2, 1.55, 2.7], lookAt: [0, 1.4, 0] },
    form: 'code',
    title: 'Show the shape, not the file',
    lang: 'js',
    lines: [
      'export function goTo(id) {',
      '  const slide = slides.find((s) => s.id === id)',
      '  camera.lerp(slide.camera)',
      '}',
    ],
    highlight: [2],
    steps: 1,
    notes: 'Dim the rest. Speak the why.',
  },
  {
    id: 'punch',
    camera: { position: [2.4, 2.2, 5.2], lookAt: [0, 1.0, 0] },
    form: 'punch',
    title: '',
    steps: 1,
    notes: 'The room is the slide. Pause. Then go back to the glass.',
  },
]
