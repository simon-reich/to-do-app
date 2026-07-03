import { defineStore } from 'pinia'
import { ref } from 'vue'
import { applyTheme } from '../composables/useTheme'

function uuid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

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
  const priorityShadow = ref<'mono' | 'dark'>('dark')
  const savedThemes = ref<ColorTheme[]>([])

  function apply(bg: string, gray: string) {
    activeBg.value = bg
    activeGray.value = gray
    applyTheme(bg, gray, rounded.value, priorityShadow.value)
  }

  function toggleRounded() {
    rounded.value = !rounded.value
    applyTheme(activeBg.value, activeGray.value, rounded.value, priorityShadow.value)
  }

  function togglePriorityShadow() {
    priorityShadow.value = priorityShadow.value === 'dark' ? 'mono' : 'dark'
    applyTheme(activeBg.value, activeGray.value, rounded.value, priorityShadow.value)
  }

  function saveTheme(name: string) {
    savedThemes.value.push({
      id: uuid(),
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

  return { activeBg, activeGray, rounded, priorityShadow, savedThemes, apply, toggleRounded, togglePriorityShadow, saveTheme, deleteTheme, loadTheme }
}, { persist: true })
