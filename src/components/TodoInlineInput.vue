<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, ChevronDown, ChevronUp } from '@lucide/vue'
import { useTodosStore } from '../stores/todos'
import TagBadge from './TagBadge.vue'

const store = useTodosStore()
const emit = defineEmits<{ saved: [] }>()

const title = ref('')
const note = ref('')
const selectedTagIds = ref<string[]>([])
const selectedProjectId = ref('')
const expanded = ref(false)
const showTagPicker = ref(false)
const titleInput = ref<HTMLInputElement>()

function save() {
  if (!title.value.trim()) return
  store.addTodo(title.value, {
    note: note.value.trim() || undefined,
    tags: selectedTagIds.value,
    projectId: selectedProjectId.value || undefined,
  })
  title.value = ''
  note.value = ''
  selectedTagIds.value = []
  selectedProjectId.value = ''
  titleInput.value?.focus()
  emit('saved')
}

function clear() {
  title.value = ''
  note.value = ''
  selectedTagIds.value = []
  selectedProjectId.value = ''
  expanded.value = false
  showTagPicker.value = false
  titleInput.value?.focus()
}

function toggleTag(id: string) {
  const idx = selectedTagIds.value.indexOf(id)
  if (idx === -1) selectedTagIds.value.push(id)
  else selectedTagIds.value.splice(idx, 1)
}

const selectedTags = computed(() =>
  store.tags.filter(t => selectedTagIds.value.includes(t.id))
)
</script>

<template>
  <div class="inline-input">
    <div class="title-row">
      <input
        ref="titleInput"
        v-model="title"
        class="title-input"
        placeholder="Todo hinzufügen…"
        autofocus
        @keydown.enter.prevent="save"
        @keydown.escape="clear"
      />
      <button class="add-btn" :disabled="!title.trim()" @click="save">
        <Plus :size="18" />
      </button>
    </div>

    <button class="details-toggle" type="button" @click="expanded = !expanded">
      <component :is="expanded ? ChevronUp : ChevronDown" :size="13" />
      {{ expanded ? 'Details ausblenden' : '+ Details' }}
    </button>

    <div v-if="expanded" class="details">
      <textarea
        v-model="note"
        class="note-input"
        placeholder="Notiz…"
        rows="2"
      />

      <div class="field-row">
        <div class="tag-picker-wrap">
          <button
            class="field-btn"
            type="button"
            :class="{ active: showTagPicker }"
            @click="showTagPicker = !showTagPicker"
          >
            Tags {{ selectedTagIds.length ? `(${selectedTagIds.length})` : '' }}
          </button>
          <div v-if="showTagPicker" class="picker-dropdown">
            <p v-if="!store.tags.length" class="picker-empty">Noch keine Tags</p>
            <label v-for="tag in store.tags" :key="tag.id" class="picker-item">
              <input
                type="checkbox"
                :checked="selectedTagIds.includes(tag.id)"
                @change="toggleTag(tag.id)"
              />
              <TagBadge :tag="tag" />
            </label>
          </div>
        </div>

        <select v-model="selectedProjectId" class="project-select">
          <option value="">Kein Projekt</option>
          <option v-for="p in store.projects" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </div>

      <div v-if="selectedTags.length" class="selected-tags">
        <TagBadge v-for="tag in selectedTags" :key="tag.id" :tag="tag" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.inline-input {
  background: var(--surface);
  box-shadow: 3px 3px 0 var(--text);
  padding: 14px;
  margin-bottom: 24px;
}

.title-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.title-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  background: transparent;
  color: var(--text);
}

.title-input::placeholder {
  color: var(--gray);
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.1s;
}

.add-btn:disabled {
  background: var(--border);
  cursor: default;
}

.add-btn:not(:disabled):hover {
  background: var(--accent-hover);
}

.details-toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 0;
  border: none;
  background: none;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
}

.details-toggle:hover {
  color: var(--text);
}

.details {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 0;
  padding: 8px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  color: var(--text);
  background: var(--bg);
  outline: none;
}

.note-input:focus {
  border-color: var(--accent);
}

.field-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.tag-picker-wrap {
  position: relative;
}

.field-btn {
  padding: 4px 10px;
  border: 1px solid var(--border);
  border-radius: 0;
  background: var(--bg);
  font-size: 12px;
  cursor: pointer;
  color: var(--text-muted);
  transition: border-color 0.15s;
}

.field-btn:hover,
.field-btn.active {
  border-color: var(--accent);
  color: var(--accent);
}

.picker-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 50;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px;
  min-width: 160px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.picker-empty {
  font-size: 12px;
  color: var(--text-muted);
  padding: 4px 6px;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 13px;
}

.picker-item:hover {
  background: var(--bg);
}

.picker-item input[type="checkbox"] {
  cursor: pointer;
}

.project-select {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 0;
  background: var(--bg);
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  outline: none;
}

.project-select:focus {
  border-color: var(--accent);
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
</style>
