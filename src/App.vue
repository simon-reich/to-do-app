<script setup lang="ts">
import { ref, provide, watch, onMounted, onUnmounted, nextTick, useTemplateRef } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { Globe, Sun, CalendarDays, Settings, ArrowUpDown, Tag, ArrowRight, LayoutList, LayoutGrid } from '@lucide/vue'
import { useTodosStore, PRIORITY_TAG_ID } from './stores/todos'
import { useThemeStore } from './stores/theme'
import { useFontLabStore } from './stores/fontlab'
import { useDevStore } from './stores/dev'
import { useOverflowSpacer } from './composables/useOverflowSpacer'
import TagSelectModal from './components/TagSelectModal.vue'

const themeStore = useThemeStore()
const devStore = useDevStore()
useFontLabStore()

let lastViewportHeight = 0
function onViewportResize() {
  const vv = window.visualViewport
  if (!vv) return
  const shrunk = lastViewportHeight > 0 && vv.height > lastViewportHeight + 100
  lastViewportHeight = vv.height
  if (shrunk && document.activeElement === todoInputRef.value) {
    todoInputRef.value?.blur()
  }
}

onMounted(() => {
  store.ensureSystemTags()
  themeStore.apply(themeStore.activeBg, themeStore.activeGray)
  nextTick(checkScrollState)
  lastViewportHeight = window.visualViewport?.height ?? 0
  window.visualViewport?.addEventListener('resize', onViewportResize)

  if (contentInnerRef.value) {
    contentResizeObserver = new ResizeObserver(checkScrollState)
    contentResizeObserver.observe(contentInnerRef.value)
  }

  if (tagsListInnerRef.value) {
    tagsResizeObserver = new ResizeObserver(checkTagsPanelScrollState)
    tagsResizeObserver.observe(tagsListInnerRef.value)
  }
})

onUnmounted(() => {
  window.visualViewport?.removeEventListener('resize', onViewportResize)
  contentResizeObserver?.disconnect()
  tagsResizeObserver?.disconnect()
})

const store = useTodosStore()
const router = useRouter()
const route = useRoute()

// ── Toast bubbles ──
let toastIdCounter = 0
const toasts = ref<{ id: number; label: string; offsetY: number }[]>([])

function spawnToast(label: string, offsetY: number) {
  const id = ++toastIdCounter
  toasts.value.push({ id, label, offsetY })
  setTimeout(() => {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }, 1400)
}

// ── Tag sidebar ──
const tagInput = ref('')

// ── Delete tag confirmation ──
const deleteConfirm = ref<{ id: string; label: string } | null>(null)

function handleDeleteTag(id: string, label: string) {
  const inUse = store.todos.some(t => t.tags.includes(id))
  if (inUse) { deleteConfirm.value = { id, label }; return }
  store.deleteTag(id)
}

function confirmDeleteTag() {
  if (deleteConfirm.value) store.deleteTag(deleteConfirm.value.id)
  deleteConfirm.value = null
}

function handleTagKey(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  const labels = tagInput.value.split(',').map(s => s.trim()).filter(Boolean)
  let dupIndex = 0
  labels.forEach(label => {
    if (!store.tags.find(t => t.label.toLowerCase() === label.toLowerCase())) {
      store.addTag(label)
    } else {
      const i = dupIndex++
      setTimeout(() => spawnToast(label, i * 22), i * 300)
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
const todoInputRef = ref<HTMLInputElement | null>(null)
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
  const todo = store.addTodo(todoInput.value, { tags: [...newTodoTagIds.value] })
  if (route.path === '/focus') store.sendToToday(todo.id)
  todoInput.value = ''
  newTodoTagIds.value = []
}

// ── Sort: toggle between date (newest first) and A–Z ──
const sortKey = ref<'createdAt' | 'title'>('createdAt')
function toggleSort() {
  sortKey.value = sortKey.value === 'createdAt' ? 'title' : 'createdAt'
}

// ── List view toggle (desktop, overview only) ──
const listView = ref(false)
provide('listView', listView)

// ── Settings toggle ──
function toggleSettings() {
  showMobileTags.value = false
  if (route.path === '/settings') router.push('/all')
  else router.push('/settings')
}

// ── Mobile tag panel ──
const showMobileTags = ref(false)

provide('activeTagIds', activeTagIds)
provide('sortKey', sortKey)

// ── Scroll dividers ──
const mainContentRef = useTemplateRef<HTMLElement>('mainContent')
const isScrolled = ref(false)
const isScrolledToBottom = ref(true)
const bottomSpacerRef = useTemplateRef<HTMLElement>('bottomSpacer')
const { overflows: mainContentOverflows, check: checkMainContentOverflow } = useOverflowSpacer()

function checkScrollState() {
  const el = mainContentRef.value
  const inner = contentInnerRef.value
  if (!el) return
  isScrolled.value = el.scrollTop > 0
  isScrolledToBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
  checkMainContentOverflow(el, inner, bottomSpacerRef.value)
}

function onScroll() { checkScrollState() }

const contentInnerRef = useTemplateRef<HTMLElement>('contentInner')
let contentResizeObserver: ResizeObserver | null = null
let tagsResizeObserver: ResizeObserver | null = null

// ── Sidebar scroll divider ──
const sidebarRef = ref<HTMLElement | null>(null)
const sidebarScrolled = ref(false)
function onSidebarScroll() {
  sidebarScrolled.value = (sidebarRef.value?.scrollTop ?? 0) > 0
}

// ── Mobile tags panel scroll divider ──
const tagsPanelRef = ref<HTMLElement | null>(null)
const tagsListInnerRef = useTemplateRef<HTMLElement>('tagsListInner')
const tagsPanelScrolled = ref(false)
const tagsPanelScrolledToBottom = ref(true)
const tagsBottomSpacerRef = useTemplateRef<HTMLElement>('tagsBottomSpacer')
const { overflows: tagsPanelOverflows, check: checkTagsPanelOverflow } = useOverflowSpacer()
function checkTagsPanelScrollState() {
  const el = tagsPanelRef.value
  if (!el) return
  tagsPanelScrolled.value = el.scrollTop > 0
  tagsPanelScrolledToBottom.value = el.scrollTop + el.clientHeight >= el.scrollHeight - 2
  checkTagsPanelOverflow(el, el, tagsBottomSpacerRef.value)
}
function onTagsPanelScroll() { checkTagsPanelScrollState() }

watch(showMobileTags, (open) => {
  if (open && tagsPanelRef.value) tagsPanelRef.value.scrollTop = 0
  tagsPanelScrolled.value = false
  if (open) nextTick(checkTagsPanelScrollState)
})

watch(() => route.path, () => {
  const el = mainContentRef.value
  if (el) el.scrollTop = 0
  if (sidebarRef.value) sidebarRef.value.scrollTop = 0
  nextTick(checkScrollState)
})
</script>

<template>
  <div
    id="app"
    :class="{
      'is-settings': route.path === '/settings',
      'is-calendar': route.path === '/calendar',
      'mobile-tags-open': showMobileTags,
      'dev-divider-full': devStore.dividerStyle === 'full',
      'dev-divider-inset-narrow': devStore.dividerStyle === 'inset-narrow',
    }"
  >

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
        <!-- Layout + sort buttons (desktop, overview only) -->
        <div v-if="route.path === '/all'" class="sort-nav desktop-only">
          <button
            :title="listView ? 'Switch to grid view' : 'Switch to list view'"
            class="sort-btn"
            @click="listView = !listView"
          >
            <component :is="listView ? LayoutGrid : LayoutList" :size="22" />
          </button>
          <button
            :title="sortKey === 'createdAt' ? 'By date – switch to A–Z' : 'A–Z – switch to date'"
            class="sort-btn"
            @click="toggleSort"
          >
            <ArrowUpDown :size="22" />
          </button>
        </div>

        <!-- Add todo input -->
        <div class="add-wrapper" :class="{ 'add-wrapper--open': showTagModal && store.tags.length }">
          <input
            ref="todoInputRef"
            v-model="todoInput"
            class="add-input"
            placeholder="add + enter"
            @focus="onTodoFocus"
            @input="onTodoInput"
            @blur="onTodoBlur"
            @keydown.enter.prevent="addTodo"
            @keydown.escape="showTagModal = false; todoInputRef?.blur()"
          />
          <div v-if="showTagModal && store.tags.length" class="add-tag-row" @mousedown.prevent>
            <label
              v-for="tag in store.tags"
              :key="tag.id"
              class="tag-row-opt"
              :class="{ checked: newTodoTagIds.includes(tag.id), dimmed: newTodoTagIds.length > 0 && !newTodoTagIds.includes(tag.id) }"
            >
              <input type="checkbox" :checked="newTodoTagIds.includes(tag.id)" @change="newTodoTagIds = newTodoTagIds.includes(tag.id) ? newTodoTagIds.filter(i => i !== tag.id) : [...newTodoTagIds, tag.id]" />
              <span>{{ tag.label }}</span>
            </label>
          </div>
        </div>

        <!-- Desktop nav icons -->
        <nav class="top-nav desktop-only">
          <RouterLink to="/all" class="nav-icon" title="All todos">
            <Globe :size="27" />
          </RouterLink>
          <RouterLink to="/focus" class="nav-icon" title="Focus">
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
    <aside ref="sidebarRef" class="sidebar desktop-only" @scroll="onSidebarScroll">
      <div class="sidebar-scroll-divider" :class="{ visible: sidebarScrolled }" />
      <div class="tag-list">
        <button
          class="all-btn"
          :class="{ active: activeTagIds.length === 0, dimmed: activeTagIds.length > 0 }"
          @click="activeTagIds = []"
        >
          all
        </button>

        <button
          class="all-btn priority-btn"
          :class="{ active: activeTagIds.includes(PRIORITY_TAG_ID), dimmed: activeTagIds.length > 0 && !activeTagIds.includes(PRIORITY_TAG_ID) }"
          @click="toggleTag(PRIORITY_TAG_ID)"
        >
          priority
        </button>

        <div
          v-for="tag in store.userTags"
          :key="tag.id"
          class="tag-chip"
          :class="{
            active: activeTagIds.includes(tag.id),
            dimmed: activeTagIds.length > 0 && !activeTagIds.includes(tag.id)
          }"
        >
          <span class="tag-label" @click="toggleTag(tag.id)">{{ tag.label }}</span>
          <button class="tag-x" title="Delete" @click="handleDeleteTag(tag.id, tag.label)">×</button>
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
    <div ref="tagsPanelRef" class="mobile-tags-panel mobile-only" @scroll="onTagsPanelScroll">
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
        <div class="tags-scroll-divider" :class="{ visible: tagsPanelScrolled }" />
      </div>

      <div ref="tagsListInner" class="tag-list mobile-tag-list">
        <button
          class="all-btn"
          :class="{ active: activeTagIds.length === 0, dimmed: activeTagIds.length > 0 }"
          @click="activeTagIds = []"
        >
          all
        </button>

        <button
          class="all-btn priority-btn"
          :class="{ active: activeTagIds.includes(PRIORITY_TAG_ID), dimmed: activeTagIds.length > 0 && !activeTagIds.includes(PRIORITY_TAG_ID) }"
          @click="toggleTag(PRIORITY_TAG_ID)"
        >
          priority
        </button>

        <div
          v-for="tag in store.userTags"
          :key="tag.id"
          class="tag-chip"
          :class="{
            active: activeTagIds.includes(tag.id),
            dimmed: activeTagIds.length > 0 && !activeTagIds.includes(tag.id)
          }"
        >
          <span class="tag-label" @click="toggleTag(tag.id)">{{ tag.label }}</span>
          <button class="tag-x" title="Delete" @click="handleDeleteTag(tag.id, tag.label)">×</button>
        </div>
        <div ref="tagsBottomSpacer" class="bottom-breathing-spacer" :style="{ height: tagsPanelOverflows ? '44px' : '0px' }" />
      </div>
    </div>
    <div v-if="showMobileTags" class="tags-scroll-divider-bottom mobile-only" :class="{ visible: !tagsPanelScrolledToBottom }" />

    <!-- ══ Main content ══ -->
    <main ref="mainContent" class="main-content" @scroll="onScroll">
      <div class="scroll-divider" :class="{ visible: isScrolled }" />
      <div ref="contentInner" class="content-inner">
        <RouterView />
        <div v-if="route.path !== '/calendar'" ref="bottomSpacer" class="bottom-breathing-spacer" :style="{ height: mainContentOverflows ? '60px' : '0px' }" />
      </div>
    </main>

    <!-- ══ MOBILE: Bottom scroll divider (above bottom nav) ══ -->
    <div class="scroll-divider-bottom mobile-only" :class="{ visible: !isScrolledToBottom }" />

    <!-- ══ MOBILE: Bottom nav ══ -->
    <nav class="mobile-bottom-nav mobile-only">
      <button
        class="sort-btn"
        :style="{ visibility: route.path === '/all' ? 'visible' : 'hidden' }"
        :title="sortKey === 'createdAt' ? 'By date – switch to A–Z' : 'A–Z – switch to date'"
        @click="toggleSort"
      >
        <ArrowUpDown :size="22" />
      </button>

      <div class="mobile-nav-views">
        <RouterLink to="/all" class="nav-icon" title="All todos" @click="showMobileTags = false">
          <Globe :size="24" />
        </RouterLink>
        <RouterLink to="/focus" class="nav-icon" title="Focus" @click="showMobileTags = false">
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

  <!-- Toast bubbles -->
  <div
    v-for="toast in toasts"
    :key="toast.id"
    class="toast"
    :style="{ top: (168 + toast.offsetY) + 'px' }"
  >already exists: {{ toast.label }}</div>

  <!-- Delete tag confirmation modal -->
  <template v-if="deleteConfirm">
    <div class="modal-backdrop" @click="deleteConfirm = null" />
    <div class="modal-box" role="dialog">
      <p class="modal-text">Delete tag <strong>{{ deleteConfirm.label }}</strong>? It is still assigned to some todos.</p>
      <div class="modal-actions">
        <button class="modal-btn modal-btn--cancel" @click="deleteConfirm = null">Cancel</button>
        <button class="modal-btn modal-btn--delete" @click="confirmDeleteTag">Delete</button>
      </div>
    </div>
  </template>
</template>
