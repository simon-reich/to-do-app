<script setup lang="ts">
import { ref } from 'vue'
import { X, Trash2, Eye, EyeOff, Download, Upload } from '@lucide/vue'
import { useTodosStore } from '../stores/todos'
import { useStorage } from '../composables/useStorage'
import TagForm from './TagForm.vue'

const emit = defineEmits<{ close: [] }>()
const store = useTodosStore()
const { exportData, importData } = useStorage()

const newProjectName = ref('')

function addProject() {
  if (!newProjectName.value.trim()) return
  store.addProject(newProjectName.value)
  newProjectName.value = ''
}

function updateProjectName(id: string, value: string) {
  if (value.trim()) store.updateProject(id, { name: value })
}

async function handleImport() {
  const confirmed = window.confirm('Import ersetzt alle aktuellen Daten. Fortfahren?')
  if (!confirmed) return
  await importData()
}
</script>

<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-header">
          <h2>Einstellungen</h2>
          <button class="close-btn" @click="emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="modal-body">
          <!-- Tags -->
          <TagForm />

          <hr class="divider" />

          <!-- Projekte -->
          <div class="project-form">
            <h3 class="section-title">Projekte</h3>

            <div class="bulk-row">
              <input
                v-model="newProjectName"
                class="bulk-input"
                placeholder="Projektname…"
                @keydown.enter.prevent="addProject"
              />
              <button class="create-btn" :disabled="!newProjectName.trim()" @click="addProject">
                Anlegen
              </button>
            </div>

            <div v-if="store.projects.length" class="project-list">
              <div v-for="project in store.projects" :key="project.id" class="project-row">
                <input
                  class="project-name-input"
                  :value="project.name"
                  @blur="updateProjectName(project.id, ($event.target as HTMLInputElement).value)"
                  @keydown.enter="($event.target as HTMLInputElement).blur()"
                />
                <button
                  class="vis-btn"
                  :title="project.visible ? 'Ausblenden' : 'Einblenden'"
                  @click="store.updateProject(project.id, { visible: !project.visible })"
                >
                  <component :is="project.visible ? Eye : EyeOff" :size="14" />
                </button>
                <button class="delete-btn" @click="store.deleteProject(project.id)">
                  <Trash2 :size="14" />
                </button>
              </div>
            </div>

            <p v-else class="empty-hint">Noch keine Projekte.</p>
          </div>

          <hr class="divider" />

          <!-- Import / Export -->
          <div class="io-section">
            <h3 class="section-title">Daten</h3>
            <div class="io-row">
              <button class="io-btn" @click="exportData">
                <Download :size="15" /> Exportieren
              </button>
              <button class="io-btn io-btn--import" @click="handleImport">
                <Upload :size="15" /> Importieren
              </button>
            </div>
            <p class="hint">Export speichert alle Todos, Tags und Projekte als JSON.</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

@media (min-width: 480px) {
  .modal-backdrop {
    align-items: center;
  }
}

.modal {
  background: var(--surface);
  border-radius: 16px 16px 0 0;
  width: 100%;
  max-width: var(--max-width);
  max-height: 85svh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

@media (min-width: 480px) {
  .modal {
    border-radius: 16px;
    max-height: 80svh;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 14px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-header h2 {
  font-size: 17px;
  font-weight: 600;
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 8px;
  background: var(--bg);
  color: var(--text-muted);
  cursor: pointer;
}

.close-btn:hover {
  color: var(--text);
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.divider {
  border: none;
  border-top: 1px solid var(--border);
  margin: 0;
}

/* Project form (mirrors TagForm styles) */
.project-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  margin: 0;
}

.bulk-row {
  display: flex;
  gap: 8px;
}

.bulk-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  color: var(--text);
  background: var(--bg);
  outline: none;
}

.bulk-input:focus {
  border-color: var(--accent);
}

.create-btn {
  padding: 8px 14px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

.create-btn:disabled {
  background: var(--border);
  cursor: default;
}

.create-btn:not(:disabled):hover {
  background: var(--accent-hover);
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.project-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.project-name-input {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  color: var(--text);
  background: var(--bg);
  outline: none;
  min-width: 0;
}

.project-name-input:focus {
  border-color: var(--accent);
}

.vis-btn,
.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
}

.vis-btn:hover {
  color: var(--accent);
  background: var(--accent-subtle);
}

.delete-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
}

.io-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.io-row {
  display: flex;
  gap: 8px;
}

.io-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s;
}

.io-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.io-btn--import {
  color: var(--text-muted);
}

.hint {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
