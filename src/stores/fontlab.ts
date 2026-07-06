import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { applyAppFonts } from '../composables/useAppFonts'

export const useFontLabStore = defineStore('fontlab', () => {
  const playfulFont = ref<string>('Caveat')
  const monoFont = ref<string>('Anonymous Pro')

  watch([playfulFont, monoFont], ([playful, mono]) => {
    applyAppFonts(playful, mono)
  }, { immediate: true })

  return { playfulFont, monoFont }
}, { persist: true })
