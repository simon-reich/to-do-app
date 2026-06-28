<script setup lang="ts">
import { useStorage } from '../composables/useStorage'

const { exportData, importData } = useStorage()

async function handleImport() {
  const confirmed = window.confirm('Import will replace all current data. Continue?')
  if (!confirmed) return
  await importData()
}
</script>

<template>
  <div class="settings-view">
    <div class="btn-row">
      <button class="action-btn" @click="exportData">Export JSON</button>
      <button class="action-btn" @click="handleImport">Import JSON</button>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  width: 100%;
  max-width: 600px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.btn-row {
  display: flex;
  gap: 10px;
}

.action-btn {
  padding: 7px 16px;
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  background: transparent;
  color: var(--gray);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s;
}

.action-btn:hover {
  border-color: var(--gray-dark);
  color: var(--gray-dark);
}
</style>
