import { nextTick, watch } from 'vue'

// Vue's built-in <TransitionGroup> move animation turned out unreliable
// here — its FLIP trick (invert transform, force reflow, clear transform
// under a transitioning CSS class) never actually started a transition in
// this app (verified via document.getAnimations() staying empty), for
// reasons not worth chasing further. This does the same FLIP technique by
// hand with the Web Animations API instead, which the swipe/celebration
// effects elsewhere in the app already rely on directly and know works.
//
// Usage: call useListFlip(() => idsInRenderOrder, selector) once per list
// view. Each item's root element must carry `data-flip-id="<id>"` (falls
// through automatically onto a child component's root via a `data-flip-id`
// prop/attr on the component tag). Whenever the id list changes, elements
// whose position actually moved animate from their old spot to the new one.
export function useListFlip(ids: () => string[], containerSelector: string) {
  let oldRects: Map<string, DOMRect> | null = null

  function capture() {
    const container = document.querySelector(containerSelector)
    if (!container) { oldRects = null; return }
    const map = new Map<string, DOMRect>()
    container.querySelectorAll<HTMLElement>('[data-flip-id]').forEach(el => {
      map.set(el.dataset.flipId!, el.getBoundingClientRect())
    })
    oldRects = map
  }

  async function play() {
    const captured = oldRects
    oldRects = null
    if (!captured) return
    await nextTick()
    const container = document.querySelector(containerSelector)
    if (!container) return
    container.querySelectorAll<HTMLElement>('[data-flip-id]').forEach(el => {
      const id = el.dataset.flipId!
      const oldRect = captured.get(id)
      if (!oldRect) return
      const newRect = el.getBoundingClientRect()
      const dx = oldRect.left - newRect.left
      const dy = oldRect.top - newRect.top
      if (!dx && !dy) return
      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: 'translate(0, 0)' },
        ],
        { duration: 380, easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)' },
      )
    })
  }

  // flush: 'pre' runs before the DOM patch for this same reactive change,
  // so capture() still sees the old layout; play()'s nextTick then waits
  // for the patch to land before measuring/animating the new one.
  watch(ids, () => { capture(); play() }, { flush: 'pre' })
}
