<script setup lang="ts">
import { ref, computed } from 'vue'
import { Pencil, Trash2, ArrowRight, X, Check } from '@lucide/vue'
import { useTodosStore, type Todo } from '../stores/todos'
import TagBadge from './TagBadge.vue'

const props = defineProps<{ todo: Todo }>()
const store = useTodosStore()

const editing = ref(false)
const editTitle = ref('')
const editNote = ref('')
const editTagIds = ref<string[]>([])
const editProjectId = ref('')
const showTagPicker = ref(false)

function startEdit() {
  editTitle.value = props.todo.title
  editNote.value = props.todo.note ?? ''
  editTagIds.value = [...props.todo.tags]
  editProjectId.value = props.todo.projectId ?? ''
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  showTagPicker.value = false
}

function saveEdit() {
  if (!editTitle.value.trim()) return
  store.updateTodo(props.todo.id, {
    title: editTitle.value,
    note: editNote.value.trim() || undefined,
    tags: editTagIds.value,
    projectId: editProjectId.value || undefined,
  })
  editing.value = false
  showTagPicker.value = false
}

function toggleTag(id: string) {
  const idx = editTagIds.value.indexOf(id)
  if (idx === -1) editTagIds.value.push(id)
  else editTagIds.value.splice(idx, 1)
}

const todoTags = computed(() =>
  store.tags.filter(t => props.todo.tags.includes(t.id))
)

const editSelectedTags = computed(() =>
  store.tags.filter(t => editTagIds.value.includes(t.id))
)

const projectName = computed(() =>
  props.todo.projectId
    ? store.projects.find(p => p.id === props.todo.projectId)?.name
    : undefined
)
</script>

<template>
  <!-- Display mode -->
  <div v-if="!editing" class="todo-item">
    <div class="todo-main">
      <span class="todo-title">{{ todo.title }}</span>
      <div class="todo-actions">
        <button
          v-if="!todo.inToday"
          class="action-btn today-btn"
          title="Zu Heute hinzufügen"
          @click="store.sendToToday(todo.id)"
        >
          <ArrowRight :size="18" />
        </button>
        <button class="action-btn" title="Bearbeiten" @click="startEdit">
          <Pencil :size="18" />
        </button>
        <button class="action-btn delete-btn" title="Löschen" @click="store.deleteTodo(todo.id)">
          <Trash2 :size="18" />
        </button>
      </div>
    </div>

    <p v-if="todo.note" class="todo-note">{{ todo.note }}</p>

    <div v-if="todoTags.length || projectName" class="todo-meta">
      <span v-if="projectName" class="project-chip">{{ projectName }}</span>
      <TagBadge v-for="tag in todoTags" :key="tag.id" :tag="tag" />
    </div>
  </div>

  <!-- Edit mode -->
  <div v-else class="todo-item todo-item--editing">
    <input
      v-model="editTitle"
      class="edit-title"
      @keydown.enter.prevent="saveEdit"
      @keydown.escape="cancelEdit"
    />

    <textarea
      v-model="editNote"
      class="edit-note"
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
          Tags {{ editTagIds.length ? `(${editTagIds.length})` : '' }}
        </button>
        <div v-if="showTagPicker" class="picker-dropdown">
          <p v-if="!store.tags.length" class="picker-empty">Noch keine Tags</p>
          <label v-for="tag in store.tags" :key="tag.id" class="picker-item">
            <input
              type="checkbox"
              :checked="editTagIds.includes(tag.id)"
              @change="toggleTag(tag.id)"
            />
            <TagBadge :tag="tag" />
          </label>
        </div>
      </div>

      <select v-model="editProjectId" class="project-select">
        <option value="">Kein Projekt</option>
        <option v-for="p in store.projects" :key="p.id" :value="p.id">
          {{ p.name }}
        </option>
      </select>
    </div>

    <div v-if="editSelectedTags.length" class="selected-tags">
      <TagBadge v-for="tag in editSelectedTags" :key="tag.id" :tag="tag" />
    </div>

    <div class="edit-actions">
      <button class="btn-save" @click="saveEdit">
        <Check :size="14" /> Speichern
      </button>
      <button class="btn-cancel" @click="cancelEdit">
        <X :size="14" /> Abbrechen
      </button>
    </div>
  </div>
</template>

<style scoped>
.todo-item {
  background: var(--surface);
  box-shadow: 5px 5px 0 var(--text);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.todo-main {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.todo-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--text);
  line-height: 1.4;
  flex: 1;
}

.todo-note {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.4;
  white-space: pre-wrap;
}

.todo-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.project-chip {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 0;
  padding: 2px 8px;
}

.todo-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.action-btn:hover {
  background: var(--bg);
  color: var(--text);
}

.today-btn:hover {
  color: var(--accent);
}

.delete-btn:hover {
  color: #ef4444;
}

/* Edit mode */
.todo-item--editing {
  box-shadow: 3px 3px 0 var(--accent);
}

.edit-title {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 0;
  padding: 6px 10px;
  font-size: 15px;
  font-weight: 500;
  font-family: inherit;
  color: var(--text);
  background: var(--bg);
  outline: none;
}

.edit-title:focus {
  border-color: var(--accent);
}

.edit-note {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 0;
  padding: 6px 10px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  color: var(--text);
  background: var(--bg);
  outline: none;
}

.edit-note:focus {
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
  border-radius: 0;
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

.edit-actions {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}

.btn-save,
.btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 0;
  border: 1px solid;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-save {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.btn-save:hover {
  background: var(--accent-hover);
}

.btn-cancel {
  background: transparent;
  border-color: var(--border);
  color: var(--text-muted);
}

.btn-cancel:hover {
  background: var(--bg);
  color: var(--text);
}
</style>
