<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { Globe, Sun, CalendarDays, Settings, ArrowUpDown } from '@lucide/vue'
import { useTodosStore } from './stores/todos'
import { useThemeStore } from './stores/theme'
import { useReset } from './composables/useReset'
import TagSelectModal from './components/TagSelectModal.vue'

const { checkAndReset } = useReset()
const themeStore = useThemeStore()
onMounted(() => {
  checkAndReset()
  themeStore.apply(themeStore.activeBg, themeStore.activeGray)
})

const store = useTodosStore()
const router = useRouter()
const route = useRoute()

// ── Tag sidebar ──
const tagInput = ref('')

function handleTagKey(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  const labels = tagInput.value.split(',').map(s => s.trim()).filter(Boolean)
  labels.forEach(label => {
    if (!store.tags.find(t => t.label.toLowerCase() === label.toLowerCase())) {
      store.addTag(label, '#878080')
    }
  })
  tagInput.value = ''
}

const activeTagIds = ref<string[]>([])

function toggleTag(id: string) {
  const idx = activeTagIds.value.indexOf(id)
  if (idx === -1) activeTagIds.value.push(id)
  else activeTagIds.value.splice(idx, 1)
}

// ── Add todo ──
const todoInput = ref('')
const showTagModal = ref(false)
const newTodoTagIds = ref<string[]>([])

function onTodoFocus() {
  if (store.tags.length > 0) showTagModal.value = true
}

function onTodoBlur() {
  setTimeout(() => { showTagModal.value = false }, 200)
}

function addTodo() {
  if (!todoInput.value.trim()) return
  store.addTodo(todoInput.value, { tags: [...newTodoTagIds.value] })
  todoInput.value = ''
  newTodoTagIds.value = []
  showTagModal.value = false
}

// ── Sort: toggle between date (newest first) and A–Z ──
const sortKey = ref<'createdAt' | 'title'>('createdAt')
function toggleSort() {
  sortKey.value = sortKey.value === 'createdAt' ? 'title' : 'createdAt'
}

// ── Settings toggle ──
function toggleSettings() {
  if (route.path === '/settings') router.push('/all')
  else router.push('/settings')
}

provide('activeTagIds', activeTagIds)
provide('sortKey', sortKey)
</script>

<template>
  <div id="app" :class="{ 'is-settings': route.path === '/settings' }">
    <!-- Sidebar head: tag input -->
    <div class="sidebar-head">
      <input
        v-model="tagInput"
        class="tag-new-input"
        placeholder="tag, ... + enter"
        @keydown="handleTagKey"
      />
    </div>

    <!-- Main head: centered sort + add input + nav icons -->
    <div class="main-head">
      <div class="main-head-inner">
        <button
          class="sort-btn"
          :title="sortKey === 'createdAt' ? 'By date – switch to A–Z' : 'A–Z – switch to date'"
          @click="toggleSort"
        >
          <ArrowUpDown :size="16" />
        </button>

        <div class="add-wrapper">
          <input
            v-model="todoInput"
            class="add-input"
            placeholder="add + enter"
            @focus="onTodoFocus"
            @blur="onTodoBlur"
            @keydown.enter.prevent="addTodo"
            @keydown.escape="showTagModal = false"
          />
          <TagSelectModal
            v-if="showTagModal && store.tags.length"
            :model-value="newTodoTagIds"
            @update:model-value="newTodoTagIds = $event"
            @mousedown.prevent
          />
        </div>

        <nav class="top-nav">
          <RouterLink to="/all" class="nav-icon" title="All todos">
            <Globe :size="21" />
          </RouterLink>
          <RouterLink to="/today" class="nav-icon" title="Today">
            <Sun :size="21" />
          </RouterLink>
          <RouterLink to="/calendar" class="nav-icon" title="Calendar">
            <CalendarDays :size="21" />
          </RouterLink>
        </nav>
      </div>
    </div>

    <!-- Sidebar body: tag list + settings button -->
    <aside class="sidebar">
      <div class="tag-list">
        <button
          v-if="store.tags.length"
          class="all-btn"
          :class="{ active: activeTagIds.length === 0 }"
          @click="activeTagIds = []"
        >
          all
</button>

        <div
          v-for="tag in store.tags"
          :key="tag.id"
          class="tag-chip"
          :class="{
            active: activeTagIds.includes(tag.id),
            dimmed: activeTagIds.length > 0 && !activeTagIds.includes(tag.id)
          }"
        >
          <span class="tag-label" @click="toggleTag(tag.id)">{{ tag.label }}</span>
          <button class="tag-x" title="Delete" @click="store.deleteTag(tag.id)">×</button>
        </div>
      </div>

      <button
        class="settings-btn"
        :class="{ active: route.path === '/settings' }"
        title="Settings"
        @click="toggleSettings"
      >
        <Settings :size="26" />
      </button>
    </aside>

    <!-- Main content -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
#app {
  display: grid;
  grid-template-columns: 190px 1fr 190px;
  grid-template-rows: 68px 1fr;
  min-height: 100svh;
  padding: 28px 0 0 28px;
}

/* ── Sidebar head ── */
.sidebar-head {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  padding: 12px 16px;
}

.tag-new-input {
  width: 100%;
  font-size: 13px;
  color: var(--gray);
  background: transparent;
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  padding: 7px 10px;
  outline: none;
  transition: border-color 0.15s;
}

.tag-new-input:focus { border-color: var(--gray-dark); }
.tag-new-input::placeholder { color: var(--gray-light); }

/* ── Main head ── */
.main-head {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
}

.main-head-inner {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 640px;
}

.sort-btn {
  background: none;
  border: none;
  color: var(--gray);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.15s;
}

.sort-btn:hover { color: var(--gray-dark); }

.add-wrapper {
  flex: 1;
  position: relative;
  margin-left: 16px;
}

.add-input {
  width: 100%;
  font-size: 15px;
  color: var(--gray);
  background: transparent;
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  padding: 7px 12px;
  outline: none;
  box-shadow: 0 3px 0 var(--gray);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.add-input:focus {
  border-color: var(--gray-dark);
  box-shadow: 0 3px 0 var(--gray-dark);
}

.add-input::placeholder { color: var(--gray-light); }

.top-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-left: 16px;
}

.nav-icon {
  color: var(--gray-light);
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: color 0.15s;
}

.nav-icon:hover,
.nav-icon.router-link-active { color: var(--gray-dark); }

/* ── Sidebar body ── */
.sidebar {
  grid-column: 1;
  grid-row: 2;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.tag-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 7px;
}

.all-btn {
  background: none;
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  color: var(--gray);
  font-size: 13px;
  padding: 4px 10px;
  cursor: pointer;
  margin-bottom: 21px;
  transition: color 0.12s, border-color 0.12s;
}

.all-btn.active,
.all-btn:hover {
  color: var(--gray-dark);
  border-color: var(--gray-dark);
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 1px solid var(--gray);
  border-radius: var(--radius);
  font-size: 13px;
  color: var(--gray);
  transition: color 0.12s, border-color 0.12s;
}

.tag-chip.active {
  color: var(--gray-dark);
  border-color: var(--gray-dark);
}

.tag-chip.dimmed {
  color: var(--gray-light);
  border-color: var(--gray-light);
}

.tag-label {
  cursor: pointer;
  user-select: none;
  line-height: 1.4;
  white-space: nowrap;
}

.tag-x {
  background: none;
  border: none;
  color: var(--gray);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 0;
  transition: color 0.12s;
}

.tag-x:hover { color: var(--gray-dark); }

.settings-btn {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: var(--gray);
  cursor: pointer;
  padding: 4px 0;
  margin-top: 14px;
  margin-bottom: 28px;
  transition: color 0.15s;
}

.settings-btn:hover,
.settings-btn.active { color: var(--gray-dark); }

/* ── Settings: disable non-settings UI ── */
#app.is-settings .sidebar-head,
#app.is-settings .tag-list,
#app.is-settings .all-btn,
#app.is-settings .sort-btn,
#app.is-settings .add-wrapper {
  pointer-events: none;
  opacity: 0.35;
}

/* ── Main content ── */
.main-content {
  grid-column: 2;
  grid-row: 2;
  display: flex;
  justify-content: center;
  padding: 36px 24px 24px;
  overflow-y: auto;
}
</style>
