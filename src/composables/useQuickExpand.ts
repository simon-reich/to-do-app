// Fast height/opacity expand-collapse for the loop-interval picker — unlike
// TodoCard's own onExpandEnter/onExpandLeave (tag-row/check-row), this one
// isn't gated to mobile-only widths, since the loop picker's reveal should
// always animate, and it runs quicker to read as a snappy sub-menu rather
// than a full panel opening.
export function onQuickExpandEnter(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.height = '0px'
  e.style.opacity = '0'
  e.style.overflow = 'hidden'
  requestAnimationFrame(() => {
    e.style.transition = 'height 0.12s ease-out, opacity 0.12s ease-out'
    e.style.height = `${e.scrollHeight}px`
    e.style.opacity = '1'
  })
  e.addEventListener('transitionend', () => {
    e.style.height = ''
    e.style.opacity = ''
    e.style.overflow = ''
    e.style.transition = ''
    done()
  }, { once: true })
}

export function onQuickExpandLeave(el: Element, done: () => void) {
  const e = el as HTMLElement
  e.style.height = `${e.scrollHeight}px`
  e.style.overflow = 'hidden'
  requestAnimationFrame(() => {
    e.style.transition = 'height 0.08s ease-in, opacity 0.06s ease-in'
    e.style.height = '0px'
    e.style.opacity = '0'
  })
  e.addEventListener('transitionend', () => done(), { once: true })
}
