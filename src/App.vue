<script setup lang="ts">
import { ref, provide, onMounted } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { Globe, Sun, CalendarDays, Settings, ArrowUpDown, Tag, ArrowRight } from '@lucide/vue'
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

function onTodoInput() {
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

// ── Mobile tag panel ──
const showMobileTags = ref(false)

function closeMobileTags(path?: string) {
  showMobileTags.value = false
  if (path) router.push(path)
}

provide('activeTagIds', activeTagIds)
provide('sortKey', sortKey)
</script>

<template>
  <div id="app" :class="{ 'is-settings': route.path === '/settings', 'mobile-tags-open': showMobileTags }">

    <!-- ══ DESKTOP: Sidebar head (tag input) ══ -->
    <div class="sidebar-head desktop-only">
      <input
        v-model="tagInput"
        class="tag-new-input"
        placeholder="tag, ... + enter"
        @keydown="handleTagKey"
      />
    </div>

    <!-- ══ Main head: add todo input (hidden on settings + mobile-tags-open) ══ -->
    <div class="main-head">
      <div class="main-head-inner">
        <!-- Sort button (desktop only) -->
        <button
          class="sort-btn desktop-only"
          :title="sortKey === 'createdAt' ? 'By date – switch to A–Z' : 'A–Z – switch to date'"
          @click="toggleSort"
        >
          <ArrowUpDown :size="22" />
        </button>

        <!-- Add todo input -->
        <div class="add-wrapper">
          <input
            v-model="todoInput"
            class="add-input"
            placeholder="add + enter"
            @focus="onTodoFocus"
            @input="onTodoInput"
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

        <!-- Desktop nav icons -->
        <nav class="top-nav desktop-only">
          <RouterLink to="/all" class="nav-icon" title="All todos">
            <Globe :size="27" />
          </RouterLink>
          <RouterLink to="/today" class="nav-icon" title="Today">
            <Sun :size="27" />
          </RouterLink>
          <RouterLink to="/calendar" class="nav-icon" title="Calendar">
            <CalendarDays :size="27" />
          </RouterLink>
        </nav>

        <!-- Mobile: tag panel toggle -->
        <button class="mobile-tags-btn mobile-only" title="Tags" @click="showMobileTags = true">
          <Tag :size="22" />
        </button>
      </div>
    </div>

    <!-- ══ DESKTOP: Sidebar body (tag list) ══ -->
    <aside class="sidebar desktop-only">
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
    </aside>

    <!-- ══ DESKTOP: Settings head ══ -->
    <div class="settings-head desktop-only">
      <button
        class="settings-btn"
        :class="{ active: route.path === '/settings' }"
        title="Settings"
        @click="toggleSettings"
      >
        <Settings :size="30" />
      </button>
    </div>

    <!-- ══ MOBILE: Tag panel (full screen, replaces main-head + content) ══ -->
    <div class="mobile-tags-panel mobile-only">
      <div class="mobile-tags-head">
        <input
          v-model="tagInput"
          class="tag-new-input"
          placeholder="tag, ... + enter"
          @keydown="handleTagKey"
        />
        <button class="nav-icon back-btn" title="Back" @click="showMobileTags = false">
          <ArrowRight :size="24" />
        </button>
      </div>

      <div class="tag-list mobile-tag-list">
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
    </div>

    <!-- ══ Main content ══ -->
    <main class="main-content">
      <RouterView />
    </main>

    <!-- ══ MOBILE: Bottom nav ══ -->
    <nav class="mobile-bottom-nav mobile-only">
      <button
        class="sort-btn"
        :title="sortKey === 'createdAt' ? 'By date – switch to A–Z' : 'A–Z – switch to date'"
        @click="toggleSort"
      >
        <ArrowUpDown :size="22" />
      </button>

      <div class="mobile-nav-views">
        <RouterLink to="/all" class="nav-icon" title="All todos" @click="showMobileTags = false">
          <Globe :size="24" />
        </RouterLink>
        <RouterLink to="/today" class="nav-icon" title="Today" @click="showMobileTags = false">
          <Sun :size="24" />
        </RouterLink>
        <RouterLink to="/calendar" class="nav-icon" title="Calendar" @click="showMobileTags = false">
          <CalendarDays :size="24" />
        </RouterLink>
      </div>

      <button
        class="settings-btn"
        :class="{ active: route.path === '/settings' }"
        title="Settings"
        @click="toggleSettings"
      >
        <Settings :size="24" />
      </button>
    </nav>

  </div>
</template>

<style scoped>
/* ══ Desktop visibility helpers ══ */
.mobile-only { display: none; }

/* ══ Desktop grid layout ══ */
#app {
  display: grid;
  grid-template-columns: 230px 1fr 230px;
  grid-template-rows: 88px 1fr;
  min-height: 100svh;
  padding: 36px 36px 0 36px;
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
  border: 2px solid var(--gray);
  border-radius: var(--radius);
  padding: 9px 12px;
  outline: none;
  transition: border-color 0.15s;
}

.tag-new-input:focus { border-color: var(--gray-dark); }
.tag-new-input::placeholder { color: var(--gray); }

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
  font-size: 17px;
  color: var(--gray);
  background: transparent;
  border: 2px solid var(--gray);
  border-radius: var(--radius);
  padding: 10px 16px;
  outline: none;
  box-shadow: 0 5px 0 var(--gray);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.add-input:focus {
  border-color: var(--gray-dark);
  box-shadow: 0 5px 0 var(--gray-dark);
}

.add-input::placeholder { color: var(--gray); }

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
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  transition: color 0.15s;
}

.nav-icon:hover,
.nav-icon.router-link-active { color: var(--gray-dark); }

/* No active highlight on bottom nav while tag panel is open */
.mobile-tags-open .mobile-bottom-nav .nav-icon.router-link-active { color: var(--gray-light); }

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
  border: 2px solid var(--gray);
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
  border: 2px solid var(--gray);
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

.settings-head {
  grid-column: 3;
  grid-row: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 12px 16px;
}

.settings-btn {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: var(--gray-light);
  cursor: pointer;
  padding: 4px;
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

/* ══ Mobile layout ══ */
@media (max-width: 700px) {
  .desktop-only { display: none !important; }
  .mobile-only { display: flex; }

  #app {
    display: flex;
    flex-direction: column;
    padding: 0;
    min-height: 100svh;
  }

  /* Mobile top bar: add input + tags toggle */
  .main-head {
    padding: 12px 14px;
    background: var(--bg);
    position: sticky;
    top: 0;
    z-index: 20;
  }

  /* Hide main-head on settings and when tag panel is open */
  #app.is-settings .main-head,
  #app.mobile-tags-open .main-head {
    display: none;
  }

  .main-head-inner {
    gap: 10px;
    max-width: none;
  }

  .add-wrapper {
    margin-left: 0;
  }

  .add-input {
    font-size: 16px;
    padding: 9px 14px;
  }

  /* Tags toggle button (mobile) */
  .mobile-tags-btn {
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

  .mobile-tags-btn:hover { color: var(--gray-dark); }

  /* Mobile tag panel: hidden by default, full screen when open */
  .mobile-tags-panel {
    display: none;
    flex-direction: column;
    position: fixed;
    top: 0;
    bottom: 60px;
    left: 0;
    right: 0;
    background: var(--bg);
    z-index: 15;
    overflow-y: auto;
  }

  .mobile-tags-open .mobile-tags-panel {
    display: flex;
  }

  .mobile-tags-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    flex-shrink: 0;
    position: sticky;
    top: 0;
    background: var(--bg);
    z-index: 1;
  }

  .mobile-tags-head .tag-new-input {
    flex: 1;
  }

  .mobile-tag-list {
    padding: 16px 14px;
    flex: 1;
  }

  /* Main content on mobile */
  .main-content {
    flex: 1;
    padding: 16px 14px;
    padding-bottom: 72px;
    overflow-y: auto;
    justify-content: flex-start;
  }

  /* Mobile bottom nav */
  .mobile-bottom-nav {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    z-index: 20;
  }

  .mobile-nav-views {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  /* Settings page on mobile: hide top input bar */
  #app.is-settings .add-wrapper {
    pointer-events: none;
    opacity: 0.35;
  }
}
</style>
