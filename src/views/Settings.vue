<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from '@lucide/vue'
import { useStorage } from '../composables/useStorage'
import { useThemeStore } from '../stores/theme'
import { applyTheme } from '../composables/useTheme'
import ColorPicker from '../components/ColorPicker.vue'

const { exportData, importData, exportThemes, importThemes } = useStorage()
const themeStore = useThemeStore()

async function handleImport() {
  const confirmed = window.confirm('Import will replace all current data. Continue?')
  if (!confirmed) return
  await importData()
}

const pickerBg = ref(themeStore.activeBg)
const pickerGray = ref(themeStore.activeGray)
const themeName = ref('')
const nameInputRef = ref<HTMLInputElement | null>(null)

// Live preview only – does NOT persist to store
watch([pickerBg, pickerGray], ([bg, gray]) => {
  applyTheme(bg, gray, themeStore.rounded, themeStore.priorityShadow)
})

function saveTheme() {
  themeStore.apply(pickerBg.value, pickerGray.value)
  themeStore.saveTheme(themeName.value)
  themeName.value = ''
  nameInputRef.value?.blur()
}

const deleteThemeConfirm = ref<{ id: string; name: string } | null>(null)

function handleDeleteTheme(id: string, name: string) {
  deleteThemeConfirm.value = { id, name }
}

function confirmDeleteTheme() {
  if (deleteThemeConfirm.value) themeStore.deleteTheme(deleteThemeConfirm.value.id)
  deleteThemeConfirm.value = null
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
          ref="nameInputRef"
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
          <span class="chip-delete" role="button" @click.stop="handleDeleteTheme(t.id, t.name)">
            <X :size="14" />
          </span>
        </button>
      </div>

      <div class="btn-row">
        <button class="action-btn" @click="exportThemes">Export themes</button>
        <button class="action-btn" @click="importThemes">Import themes</button>
      </div>
    </section>

    <!-- Corner style -->
    <section class="section">
      <h2 class="section-title">Corners</h2>
      <div class="option-row">
        <button class="action-btn" :class="{ active: themeStore.rounded }" @click="themeStore.rounded || themeStore.toggleRounded()">Rounded</button>
        <button class="action-btn" :class="{ active: !themeStore.rounded }" @click="themeStore.rounded && themeStore.toggleRounded()">Square</button>
      </div>
    </section>

    <!-- Drop shadow -->
    <section class="section">
      <h2 class="section-title">Drop shadow</h2>
      <div class="option-row">
        <button class="action-btn" :class="{ active: themeStore.priorityShadow === 'dark' }" @click="themeStore.priorityShadow !== 'dark' && themeStore.togglePriorityShadow()">Dark</button>
        <button class="action-btn" :class="{ active: themeStore.priorityShadow === 'mono' }" @click="themeStore.priorityShadow !== 'mono' && themeStore.togglePriorityShadow()">Mono</button>
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

  <template v-if="deleteThemeConfirm">
    <div class="modal-backdrop" @click="deleteThemeConfirm = null" />
    <div class="modal-box" role="dialog">
      <p class="modal-text">Delete theme <strong>{{ deleteThemeConfirm.name }}</strong>?</p>
      <div class="modal-actions">
        <button class="modal-btn modal-btn--cancel" @click="deleteThemeConfirm = null">Cancel</button>
        <button class="modal-btn modal-btn--delete" @click="confirmDeleteTheme">Delete</button>
      </div>
    </div>
  </template>
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
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: var(--ink-dark);
  align-self: flex-start;
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
  color: var(--ink);
}

.name-input {
  width: 100%;
  padding: 9px 12px;
  border: 2px solid var(--ink);
  border-radius: var(--radius);
  background: transparent;
  color: var(--ink-dark);
  font-size: 15px;
  outline: none;
}

.name-input:focus { border-color: var(--ink-dark); }
.name-input::placeholder { color: var(--ink); }

.themes-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
  justify-content: center;
}

@media (max-width: 900px) {
  .themes-list {
    justify-content: flex-start;
  }
}

.theme-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 12px 7px 10px;
  border: 2px solid var(--ink);
  border-radius: var(--radius);
  background: transparent;
  color: var(--ink);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.12s, color 0.12s, box-shadow 0.12s;
  box-shadow: 4px 4px 0 var(--ink);
}

.theme-chip:hover {
  border-color: var(--ink-dark);
  color: var(--ink-dark);
  box-shadow: 4px 4px 0 var(--ink-dark);
}

.theme-chip.active {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
  box-shadow: 4px 4px 0 var(--priority-shadow);
}

.theme-chip.active .chip-delete {
  color: var(--bg);
  opacity: 0.6;
}

.theme-chip.active .chip-delete:hover {
  opacity: 1;
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
  color: var(--ink);
  cursor: pointer;
  transition: color 0.1s;
}

.chip-delete:hover { color: var(--ink-dark); }

.option-row {
  display: flex;
  gap: 10px;
}

.btn-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  padding: 10px 20px;
  border: 2px solid var(--ink);
  border-radius: var(--radius);
  background: transparent;
  color: var(--ink);
  font-size: 15px;
  cursor: pointer;
  box-shadow: 4px 4px 0 var(--ink);
  transition: background 0.12s, border-color 0.15s, color 0.15s, box-shadow 0.15s;
}

.action-btn:hover {
  border-color: var(--ink-dark);
  color: var(--ink-dark);
  box-shadow: 4px 4px 0 var(--ink-dark);
}

.action-btn.active {
  background: var(--ink);
  color: var(--bg);
  border-color: var(--ink);
  box-shadow: 4px 4px 0 var(--priority-shadow);
}
</style>
