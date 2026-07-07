import { ref } from 'vue'

// The bottom "breathing room" padding under a scrollable list is cosmetic —
// it should only ever be visible once you've actually scrolled to the end,
// never make an otherwise-fitting list scrollable in the first place. Since
// that padding itself would count towards scrollHeight, it's applied via a
// trailing spacer element instead of real padding, and its height is only
// switched on once the *real* content already overflows without it.
export function useOverflowSpacer() {
  const overflows = ref(false)

  function check(scrollEl: HTMLElement | null, contentEl: HTMLElement | null, spacerEl: HTMLElement | null) {
    if (!scrollEl || !contentEl) return
    const spacerHeight = spacerEl?.offsetHeight ?? 0
    const naturalHeight = contentEl.scrollHeight - spacerHeight
    overflows.value = naturalHeight > scrollEl.clientHeight
  }

  return { overflows, check }
}
