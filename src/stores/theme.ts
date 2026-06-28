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
  const rounded = ref(true)
  const savedThemes = ref<ColorTheme[]>([])

  function apply(bg: string, gray: string) {
    activeBg.value = bg
    activeGray.value = gray
    applyTheme(bg, gray, rounded.value)
  }

  function toggleRounded() {
    rounded.value = !rounded.value
    applyTheme(activeBg.value, activeGray.value, rounded.value)
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

  return { activeBg, activeGray, rounded, savedThemes, apply, toggleRounded, saveTheme, deleteTheme, loadTheme }
}, { persist: true })
