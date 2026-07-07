import { defineStore } from 'pinia'
import { ref } from 'vue'

// Dev-only: lets us preview different mobile scroll-divider treatments live
// and pick one, instead of guessing from code. Decided on 'full' (edge to
// edge) as the permanent style — the Settings toggle is hidden (see
// SHOW_DEV_TOOLS in Settings.vue) but left in place in case we want to
// revisit the comparison later.
export type DividerStyle = 'full' | 'inset' | 'inset-narrow'

export const useDevStore = defineStore('dev', () => {
  const dividerStyle = ref<DividerStyle>('full')
  return { dividerStyle }
}, {
  persist: true,
})
