import { onMounted, onUnmounted, nextTick, ref, type Ref } from 'vue'
import { useOverflowSpacer } from './useOverflowSpacer'

interface ScrollTrackingOptions {
  /** The element that actually scrolls (has the scroll listener). */
  scrollEl: Ref<HTMLElement | null>
  /** Measured for overflow (scrollHeight vs. scrollEl's clientHeight). Defaults to scrollEl. */
  contentEl?: Ref<HTMLElement | null>
  /** Watched by ResizeObserver so size changes (not just scroll events) re-check state. Defaults to contentEl ?? scrollEl. */
  resizeTarget?: Ref<HTMLElement | null>
  /** The trailing spacer element used by useOverflowSpacer, if any. */
  spacerEl?: Ref<HTMLElement | null>
  /** Resting gap (px) to guarantee between the last item and the bottom of
   *  scrollEl — see useOverflowSpacer. Defaults to 0 (no spacer behavior). */
  targetGap?: number
}

// Tracks "scrolled from top" / "scrolled to bottom" (for divider visibility)
// plus the bottom-breathing-spacer height, all driven off one ResizeObserver
// so content-size changes stay in sync, not just scrolling. Used for every
// scrollable pane with dividers in this app: the main content list, the
// sidebar, the mobile tags panel, and Calendar's day-detail list.
export function useScrollTracking(options: ScrollTrackingOptions) {
  const { scrollEl, contentEl, resizeTarget, spacerEl, targetGap = 0 } = options
  const scrolled = ref(false)
  const scrolledToBottom = ref(true)
  const { spacerHeight, check: checkOverflow } = useOverflowSpacer(targetGap)
  let resizeObserver: ResizeObserver | null = null

  function check() {
    const el = scrollEl.value
    if (!el) return
    scrolled.value = el.scrollTop > 0
    scrolledToBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
    checkOverflow(el, contentEl?.value ?? el, spacerEl?.value ?? null)
  }

  onMounted(() => {
    nextTick(check)
    const target = resizeTarget?.value ?? contentEl?.value ?? scrollEl.value
    if (target) {
      resizeObserver = new ResizeObserver(check)
      resizeObserver.observe(target)
    }
  })

  onUnmounted(() => resizeObserver?.disconnect())

  return { scrolled, scrolledToBottom, spacerHeight, check }
}
