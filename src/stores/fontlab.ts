import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { applyAppFonts, PLAYFUL_FONTS, MONO_FONTS } from '../composables/useAppFonts'

export const useFontLabStore = defineStore('fontlab', () => {
  const playfulFont = ref<string>(PLAYFUL_FONTS[0])
  const monoFont = ref<string>(MONO_FONTS[0])

  watch([playfulFont, monoFont], ([playful, mono]) => {
    applyAppFonts(playful, mono)
  }, { immediate: true })

  return { playfulFont, monoFont }
}, { persist: true })
