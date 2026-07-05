export const MONO_FONTS = [
  'Anonymous Pro',
  'Courier Prime',
  'Cutive Mono',
  'Inconsolata',
  'Lekton',
] as const

export const PLAYFUL_FONTS = [
  'Amatic SC',
  'Boogaloo',
  'Cause',
  'Caveat',
  'Fuzzy Bubbles',
  'Indie Flower',
  'Nothing You Could Do',
  'Permanent Marker',
  'Playpen Sans',
  'Playwrite AU TAS',
  'Playwrite NZ',
  'Rock Salt',
  'Shadows Into Light Two',
] as const

export function applyAppFonts(playful: string, mono: string) {
  const root = document.documentElement
  root.style.setProperty('--font-playful', `'${playful}', sans-serif`)
  root.style.setProperty('--font-mono', `'${mono}', monospace`)
}
