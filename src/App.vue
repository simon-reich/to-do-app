<script setup lang="ts">
import { ref, provide, onMounted, useTemplateRef } from 'vue'
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

// ── Scroll divider ──
const mainContentRef = useTemplateRef<HTMLElement>('mainContent')
const isScrolled = ref(false)
function onScroll() {
  isScrolled.value = (mainContentRef.value?.scrollTop ?? 0) > 0
}
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
    <main ref="mainContent" class="main-content" @scroll="onScroll">
      <div class="scroll-divider" :class="{ visible: isScrolled }" />
      <div class="content-inner">
        <RouterView />
      </div>
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
