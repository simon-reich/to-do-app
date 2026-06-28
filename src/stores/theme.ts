import { defineStore } from 'pinia'
import { ref } from 'vue'
import { applyTheme } from '../composables/useTheme'

export interface ColorTheme {
  id: string
  name: string
  bg: string
  gray: string
}

export const useThemeStore = defineStore('theme', () => {
  const activeBg = ref('#E2E790')
  const activeGray = ref('#878080')
  const savedThemes = ref<ColorTheme[]>([])

  function apply(bg: string, gray: string) {
    activeBg.value = bg
    activeGray.value = gray
    applyTheme(bg, gray)
  }

  function saveTheme(name: string) {
    savedThemes.value.push({
      id: crypto.randomUUID(),
      name: name.trim() || 'Theme',
      bg: activeBg.value,
      gray: activeGray.value,
    })
  }

  function deleteTheme(id: string) {
    savedThemes.value = savedThemes.value.filter(t => t.id !== id)
  }

  function loadTheme(theme: ColorTheme) {
    apply(theme.bg, theme.gray)
  }

  return { activeBg, activeGray, savedThemes, apply, saveTheme, deleteTheme, loadTheme }
}, { persist: true })
