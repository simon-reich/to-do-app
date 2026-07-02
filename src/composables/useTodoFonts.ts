// Font families available for todo card titles.
// Order matters for the hash-based assignment — don't sort alphabetically.
export const TODO_FONTS = [
  'Aleo',
  'Bodoni Moda',
  'Cardo',
  'EB Garamond',
  'Faustina',
  'Karla',
  'Lora',
  'Manrope',
  'Merienda',
  'Merriweather',
  'Montserrat',
  'Patrick Hand',
  'Roboto',
  'Roboto Condensed',
  'Roboto Slab',
  'Sorts Mill Goudy',
  'Amarante',
]

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h * 31 + id.charCodeAt(i), 1) >>> 0
  }
  return h
}

/**
 * Given an ordered list of todo IDs, return a Map from id → font-family.
 * No two adjacent entries will share the same font. The assignment is
 * deterministic (same IDs → same fonts), so it's stable across re-renders.
 */
export function assignFonts(ids: string[]): Map<string, string> {
  const result = new Map<string, string>()
  const n = TODO_FONTS.length
  let prevFont = ''

  for (const id of ids) {
    const base = hashId(id) % n
    let font = TODO_FONTS[base]
    if (font === prevFont) {
      font = TODO_FONTS[(base + 1) % n]
    }
    result.set(id, font)
    prevFont = font
  }

  return result
}
