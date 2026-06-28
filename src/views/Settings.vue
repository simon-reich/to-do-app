<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from '@lucide/vue'
import { useStorage } from '../composables/useStorage'
import { useThemeStore } from '../stores/theme'
import { applyTheme } from '../composables/useTheme'
import ColorPicker from '../components/ColorPicker.vue'

const { exportData, importData } = useStorage()
const themeStore = useThemeStore()

async function handleImport() {
  const confirmed = window.confirm('Import will replace all current data. Continue?')
  if (!confirmed) return
  await importData()
}

const pickerBg = ref(themeStore.activeBg)
const pickerGray = ref(themeStore.activeGray)
const themeName = ref('')

// Live preview only – does NOT persist to store
watch([pickerBg, pickerGray], ([bg, gray]) => {
  applyTheme(bg, gray, themeStore.rounded)
})

function saveTheme() {
  themeStore.apply(pickerBg.value, pickerGray.value)
  themeStore.saveTheme(themeName.value)
  themeName.value = ''
}
</script>

<template>
  <div class="settings-view">

    <!-- Appearance -->
    <section class="section">
      <h2 class="section-title">Colors</h2>

      <div class="color-picker-group">
        <div class="color-row">
          <div class="color-field">
            <span class="color-label">Background</span>
            <ColorPicker v-model="pickerBg" />
          </div>
          <div class="color-field">
            <span class="color-label">Ink</span>
            <ColorPicker v-model="pickerGray" />
          </div>
        </div>

        <input
          v-model="themeName"
          class="name-input"
          placeholder="Theme name + Enter to save…"
          maxlength="32"
          @keydown.enter="saveTheme"
        />
      </div>

      <div v-if="themeStore.savedThemes.length" class="themes-list">
        <button
          v-for="t in themeStore.savedThemes"
          :key="t.id"
          class="theme-chip"
          :class="{ active: t.bg === themeStore.activeBg && t.gray === themeStore.activeGray }"
          @click="themeStore.loadTheme(t); pickerBg = t.bg; pickerGray = t.gray"
        >
          <span class="chip-swatches">
            <span class="swatch" :style="{ background: t.bg }" />
            <span class="swatch" :style="{ background: t.gray }" />
          </span>
          {{ t.name }}
          <span class="chip-delete" role="button" @click.stop="themeStore.deleteTheme(t.id)">
            <X :size="14" />
          </span>
        </button>
      </div>
    </section>

    <!-- Corner style -->
    <section class="section">
      <h2 class="section-title">Corners</h2>
      <button class="action-btn" @click="themeStore.toggleRounded()">
        {{ themeStore.rounded ? 'Rounded (active)' : 'Square (active)' }}
      </button>
    </section>

    <!-- Data -->
    <section class="section">
      <h2 class="section-title">Data</h2>
      <div class="btn-row">
        <button class="action-btn" @click="exportData">Export JSON</button>
        <button class="action-btn" @click="handleImport">Import JSON</button>
      </div>
    </section>

  </div>
</template>

<style scoped>
.settings-view {
  width: 100%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  gap: 52px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gray-light);
}

.color-picker-group {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.color-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.color-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 160px;
}

.color-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray);
}

.name-input {
  width: 100%;
  padding: 9px 12px;
  border: 2px solid var(--gray);
  border-radius: var(--radius);
  background: transparent;
  color: var(--gray-dark);
  font-size: 15px;
  outline: none;
}

.name-input:focus { border-color: var(--gray-dark); }
.name-input::placeholder { color: var(--gray); }

.themes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.theme-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px 7px 10px;
  border: 2px solid var(--gray);
  border-radius: var(--radius);
  background: transparent;
  color: var(--gray);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s, box-shadow 0.12s;
  box-shadow: 4px 4px 0 var(--gray);
}

.theme-chip:hover,
.theme-chip.active {
  border-color: var(--gray-dark);
  color: var(--gray-dark);
  box-shadow: 4px 4px 0 var(--gray-dark);
}

.chip-swatches {
  display: flex;
  gap: 2px;
}

.swatch {
  display: inline-block;
  width: 13px;
  height: 13px;
  border-radius: 2px;
  border: 1px solid rgba(0,0,0,0.1);
}

.chip-delete {
  display: flex;
  align-items: center;
  margin-left: 2px;
  color: var(--gray-light);
  cursor: pointer;
  transition: color 0.1s;
}

.chip-delete:hover { color: var(--gray-dark); }

.btn-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 10px 20px;
  border: 2px solid var(--gray);
  border-radius: var(--radius);
  background: transparent;
  color: var(--gray);
  font-size: 15px;
  cursor: pointer;
  box-shadow: 4px 4px 0 var(--gray);
  transition: border-color 0.15s, color 0.15s, box-shadow 0.15s;
}

.action-btn:hover {
  border-color: var(--gray-dark);
  color: var(--gray-dark);
  box-shadow: 4px 4px 0 var(--gray-dark);
}
</style>
