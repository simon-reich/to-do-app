export function applyAppFonts(playful: string, mono: string) {
  const root = document.documentElement
  root.style.setProperty('--font-playful', `'${playful}', sans-serif`)
  root.style.setProperty('--font-mono', `'${mono}', monospace`)
}
