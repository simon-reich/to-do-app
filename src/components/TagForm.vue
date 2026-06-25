<script setup lang="ts">
import { ref } from 'vue'
import { Trash2 } from '@lucide/vue'
import { useTodosStore } from '../stores/todos'
import { randomColor } from '../utils/randomColor'
import TagBadge from './TagBadge.vue'

const store = useTodosStore()
const bulkInput = ref('')

function createBulk() {
  const labels = bulkInput.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
  labels.forEach(label => store.addTag(label, randomColor()))
  bulkInput.value = ''
}

function updateLabel(id: string, value: string) {
  if (value.trim()) store.updateTag(id, { label: value })
}

function updateColor(id: string, value: string) {
  store.updateTag(id, { color: value })
}
</script>

<template>
  <div class="tag-form">
    <h3 class="section-title">Tags</h3>

    <div class="bulk-row">
      <input
        v-model="bulkInput"
        class="bulk-input"
        placeholder="Arbeit, Privat, Sport…"
        @keydown.enter.prevent="createBulk"
      />
      <button class="create-btn" :disabled="!bulkInput.trim()" @click="createBulk">
        Anlegen
      </button>
    </div>

    <p class="hint">Komma-getrennt eingeben, Enter zum Anlegen</p>

    <div v-if="store.tags.length" class="tag-list">
      <div v-for="tag in store.tags" :key="tag.id" class="tag-row">
        <input
          type="color"
          :value="tag.color"
          class="color-picker"
          @input="updateColor(tag.id, ($event.target as HTMLInputElement).value)"
        />
        <input
          class="tag-label-input"
          :value="tag.label"
          @blur="updateLabel(tag.id, ($event.target as HTMLInputElement).value)"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
        />
        <TagBadge :tag="tag" />
        <button class="delete-btn" @click="store.deleteTag(tag.id)">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>

    <p v-else class="empty-hint">Noch keine Tags – einfach oben anlegen.</p>
  </div>
</template>

<style scoped>
.tag-form {
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

.hint {
  font-size: 12px;
  color: var(--text-muted);
  margin: -4px 0 0;
}

.tag-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tag-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px;
  cursor: pointer;
  background: none;
  flex-shrink: 0;
}

.tag-label-input {
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

.tag-label-input:focus {
  border-color: var(--accent);
}

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

.delete-btn:hover {
  color: #ef4444;
  background: #fef2f2;
}

.empty-hint {
  font-size: 13px;
  color: var(--text-muted);
}
</style>
