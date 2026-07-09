import { ref } from 'vue'

// Guarantees the same resting gap between the last item and the bottom of
// its scroll container everywhere — whether that means leaving the natural
// whitespace alone (content already ends with plenty of room), topping it
// up with an invisible trailing spacer (content ends with less than the
// target gap, but there's still room in the viewport), or making the list
// scrollable by exactly enough to reach it (content already overflows, or
// topping up would make it overflow). The padding itself would count
// towards scrollHeight if applied directly, so it's a trailing spacer
// element instead, sized by `check`.
export function useOverflowSpacer(targetGap: number) {
  const spacerHeight = ref(0)

  function check(scrollEl: HTMLElement | null, contentEl: HTMLElement | null, spacerEl: HTMLElement | null) {
    if (!scrollEl || !contentEl) return
    const currentSpacer = spacerEl?.offsetHeight ?? 0
    const naturalHeight = contentEl.scrollHeight - currentSpacer
    const naturalGap = Math.max(0, scrollEl.clientHeight - naturalHeight)
    spacerHeight.value = Math.max(0, targetGap - naturalGap)
  }

  return { spacerHeight, check }
}
