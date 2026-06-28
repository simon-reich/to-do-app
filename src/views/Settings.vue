<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from '@lucide/vue'
import { useStorage } from '../composables/useStorage'
import { useThemeStore } from '../stores/theme'
import { applyTheme } from '../composables/useTheme'

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
  applyTheme(bg, gray)
})

function saveTheme() {
  // Persist current picker values to store, then save as named theme
  themeStore.apply(pickerBg.value, pickerGray.value)
  themeStore.saveTheme(themeName.value)
  themeName.value = ''
}
</script>

<template>
  <div class="settings-view">

    <!-- Appearance -->
    <section class="section">
      <h2 class="section-title">Appearance</h2>

      <div class="color-row">
        <label class="color-field">
          <span class="color-label">Background</span>
          <div class="color-input-wrap">
            <input type="color" v-model="pickerBg" class="color-picker" />
            <span class="color-hex">{{ pickerBg }}</span>
          </div>
        </label>
        <label class="color-field">
          <span class="color-label">Gray</span>
          <div class="color-input-wrap">
            <input type="color" v-model="pickerGray" class="color-picker" />
            <span class="color-hex">{{ pickerGray }}</span>
          </div>
        </label>
      </div>

      <input
        v-model="themeName"
        class="name-input"
        placeholder="Theme name + Enter to save…"
        maxlength="32"
        @keydown.enter="saveTheme"
      />

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
          <span
            class="chip-delete"
            role="button"
            @click.stop="themeStore.deleteTheme(t.id)"
          ><X :size="11" /></span>
        </button>
      </div>
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
  gap: 32px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--gray-light);
}

.color-row {
  display: flex;
  gap: 16px;
}

.color-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
}

.color-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray);
}

.color-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  box-shadow: 2px 2px 0 var(--gray);
}

.color-picker {
  width: 22px;
  height: 22px;
  border: none;
  padding: 0;
  background: none;
  cursor: pointer;
  border-radius: 3px;
}

.color-picker::-webkit-color-swatch-wrapper { padding: 0; }
.color-picker::-webkit-color-swatch { border: none; border-radius: 3px; }

.color-hex {
  font-size: 12px;
  font-family: monospace;
  color: var(--gray);
  min-width: 58px;
}

.name-input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  background: transparent;
  color: var(--gray-dark);
  font-size: 13px;
  outline: none;
}

.name-input:focus { border-color: var(--gray-dark); }
.name-input::placeholder { color: var(--gray-light); }

.themes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.theme-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 5px 10px 5px 8px;
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  background: transparent;
  color: var(--gray);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s;
  box-shadow: 2px 2px 0 var(--gray);
}

.theme-chip:hover,
.theme-chip.active {
  border-color: var(--gray-dark);
  color: var(--gray-dark);
  box-shadow: 2px 2px 0 var(--gray-dark);
}

.chip-swatches {
  display: flex;
  gap: 2px;
}

.swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
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
  padding: 7px 16px;
  box-shadow: 2px 2px 0 var(--gray);
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  background: transparent;
  color: var(--gray);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, box-shadow 0.15s;
}

.action-btn:hover:not(:disabled) {
  border-color: var(--gray-dark);
  color: var(--gray-dark);
  box-shadow: 2px 2px 0 var(--gray-dark);
}

.action-btn:disabled {
  opacity: 0.35;
  cursor: default;
}
</style>
