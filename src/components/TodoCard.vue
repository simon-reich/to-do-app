<script lang="ts">
// Module-level: shared across all TodoCard instances so the bag persists between card completions
const COLOR = 'var(--ink)'
function randColor() { return COLOR }

type EffectName = 'hearts' | 'stars' | 'confetti'
const effectBag: EffectName[] = []

export function nextEffect(): EffectName {
  if (effectBag.length === 0) {
    const bag: EffectName[] = ['hearts', 'hearts', 'stars', 'confetti']
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]]
    }
    effectBag.push(...bag)
  }
  return effectBag.pop()!
}

function particle(cx: number, cy: number, content: string, css: string): HTMLElement {
  const el = document.createElement('span')
  el.textContent = content
  el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;pointer-events:none;user-select:none;z-index:9999;` + css
  document.body.appendChild(el)
  return el
}

function animateOut(el: HTMLElement, _dx: number, _dy: number, endTransform: string, dur: number) {
  el.animate(
    [
      { transform: el.style.transform, opacity: 1 },
      { transform: endTransform, opacity: 0 },
    ],
    { duration: dur, easing: 'ease-out', fill: 'forwards' },
  ).onfinish = () => el.remove()
}

export function effectHearts(cx: number, cy: number) {
  for (let i = 0; i < 9; i++) {
    const size = 10 + Math.random() * 6
    const el = particle(cx, cy, '♥', `font-size:${size}px;color:${randColor()};transform:translate(-50%,-50%);`)
    const angle = -90 + (Math.random() - 0.5) * 140
    const dist = 28 + Math.random() * 38
    const dx = Math.cos((angle * Math.PI) / 180) * dist
    const dy = Math.sin((angle * Math.PI) / 180) * dist
    animateOut(el, dx, dy, `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0.3)`, 550 + Math.random() * 300)
  }
}

export function effectStars(cx: number, cy: number) {
  const glyphs = ['★', '✦', '✧', '✶']
  for (let i = 0; i < 12; i++) {
    const size = 12 + Math.random() * 8
    const glyph = glyphs[Math.floor(Math.random() * glyphs.length)]
    const el = particle(cx, cy, glyph, `font-size:${size}px;color:${randColor()};transform:translate(-50%,-50%) scale(1.2) rotate(0deg);`)
    const angle = (360 / 12) * i + (Math.random() - 0.5) * 30
    const dist = 32 + Math.random() * 28
    const dx = Math.cos((angle * Math.PI) / 180) * dist
    const dy = Math.sin((angle * Math.PI) / 180) * dist
    const spin = (Math.random() > 0.5 ? 1 : -1) * 180
    animateOut(el, dx, dy, `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0.2) rotate(${spin}deg)`, 480 + Math.random() * 260)
  }
}

export function effectConfetti(cx: number, cy: number) {
  for (let i = 0; i < 14; i++) {
    const w = 4 + Math.random() * 3
    const h = 8 + Math.random() * 6
    const initRot = Math.random() * 360
    const el = document.createElement('span')
    el.style.cssText = `position:fixed;left:${cx}px;top:${cy}px;width:${w}px;height:${h}px;background:${randColor()};pointer-events:none;user-select:none;z-index:9999;border-radius:1px;transform:translate(-50%,-50%) rotate(${initRot}deg);`
    document.body.appendChild(el)
    const angle = -90 + (Math.random() - 0.5) * 180
    const dist = 30 + Math.random() * 50
    const dx = Math.cos((angle * Math.PI) / 180) * dist
    const dy = Math.sin((angle * Math.PI) / 180) * dist + 15
    const spin = initRot + (Math.random() > 0.5 ? 1 : -1) * (180 + Math.random() * 200)
    el.animate(
      [
        { transform: `translate(-50%,-50%) rotate(${initRot}deg)`, opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) rotate(${spin}deg)`, opacity: 0 },
      ],
      { duration: 600 + Math.random() * 400, easing: 'ease-out', fill: 'forwards' },
    ).onfinish = () => el.remove()
  }
}

import { ref as vueRef } from 'vue'
// Shared across all instances – only one menu open at a time
const openTagMenuId = vueRef<string | null>(null)
const openCheckMenuId = vueRef<string | null>(null)
</script>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { CirclePlus, CircleMinus, Trash2, CheckCheck, Clock, Pencil, Check } from '@lucide/vue'
import { useTodosStore, type Todo } from '../stores/todos'

const props = defineProps<{
  todo: Todo
  mode: 'all' | 'today'
  font?: string
}>()

const store = useTodosStore()
const route = useRoute()

const isPriority = computed(() =>
  props.todo.tags.some(tid => {
    const tag = store.tags.find(t => t.id === tid)
    return tag?.label.toLowerCase() === 'priority'
  })
)


const emit = defineEmits<{
  'send-to-today': [id: string]
  'remove-from-today': [id: string]
  'complete': [id: string]
  'done-for-today': [id: string]
  'delete': [id: string]
}>()

const showMenu = computed(() => openCheckMenuId.value === props.todo.id)
const showTagMenu = computed(() => openTagMenuId.value === props.todo.id)

function toggleCheckMenu() {
  openCheckMenuId.value = openCheckMenuId.value === props.todo.id ? null : props.todo.id
}

const wrapRef = ref<HTMLElement | null>(null)

function closeOnOutside(e: MouseEvent) {
  if (wrapRef.value && !wrapRef.value.contains(e.target as Node)) {
    if (openCheckMenuId.value === props.todo.id) openCheckMenuId.value = null
    if (openTagMenuId.value === props.todo.id) openTagMenuId.value = null
  }
}

watch([showMenu, showTagMenu], ([m, t]) => {
  if (m || t) document.addEventListener('click', closeOnOutside)
  else {
    document.removeEventListener('click', closeOnOutside)
    // Only blur if focus is still inside *this* card — otherwise this fires
    // after focus has already moved on to a different card (e.g. clicking
    // straight from one open todo into another) and would steal it back.
    requestAnimationFrame(() => {
      const active = document.activeElement as HTMLElement | null
      if (active && wrapRef.value?.contains(active)) active.blur()
    })
  }
})

function toggleTagMenu() {
  showMenu.value = false
  const willOpen = openTagMenuId.value !== props.todo.id
  openTagMenuId.value = willOpen ? props.todo.id : null
  if (!willOpen && isEditing.value) saveEdit()
}

// Opens the card (if needed) and jumps straight into editing.
function openForEdit() {
  openTagMenuId.value = props.todo.id
  startEdit()
}

// Manual single/double click detection on the title, instead of the native
// dblclick event — that fires two real `click`s first (which would toggle
// the card open then shut again before the dblclick lands), and mobile
// browsers often don't fire it reliably for a double-tap at all. A plain
// click is held back briefly to see if a second one follows; if so, it's
// treated as a double-click and opens straight into editing instead.
let titleClickTimer: ReturnType<typeof setTimeout> | null = null

function handleTitleClick() {
  if (titleClickTimer) {
    clearTimeout(titleClickTimer)
    titleClickTimer = null
    if (props.mode === 'all') openForEdit()
    return
  }
  titleClickTimer = setTimeout(() => {
    titleClickTimer = null
    if (props.mode === 'today') toggleCheckMenu()
    else toggleTagMenu()
  }, 280)
}

function updateTags(tags: string[]) {
  store.updateTodo(props.todo.id, { tags })
}

// ── Edit title ──────────────────────────────────────────
const isEditing = ref(false)
const editTitle = ref('')
const editInputRef = ref<HTMLTextAreaElement | null>(null)

function autoGrow() {
  const el = editInputRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

// On mobile, focusing the textarea pops the on-screen keyboard, which can
// cover the very card you just opened if it sits low in the list. Scroll
// it fully into view once the keyboard has finished animating in (the
// visualViewport resize is the actual signal; the timeout is just a
// fallback for browsers/situations where it doesn't fire). Aligns to the
// top edge rather than centering — if the expanded card (grown by lots of
// tags/a long title) is taller than the space above the keyboard, the top
// stays reliably visible and the overflow disappears below the input
// instead of the top getting pushed off-screen.
function scrollCardIntoView() {
  // Desktop has no on-screen keyboard covering the card, so there's
  // nothing to compensate for — only mobile/tablet need this.
  if (window.innerWidth > 1024) return
  const el = wrapRef.value
  if (!el) return
  let done = false
  const doScroll = () => {
    if (done) return
    done = true
    el.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }
  window.visualViewport?.addEventListener('resize', doScroll, { once: true })
  setTimeout(doScroll, 350)
}

function startEdit() {
  editTitle.value = props.todo.title
  isEditing.value = true
  nextTick(() => {
    editInputRef.value?.focus()
    autoGrow()
    scrollCardIntoView()
  })
}

function saveEdit() {
  const trimmed = editTitle.value.trim()
  if (trimmed && trimmed !== props.todo.title) {
    store.updateTodo(props.todo.id, { title: trimmed })
  }
  isEditing.value = false
}

function acceptEdit() {
  saveEdit()
  openTagMenuId.value = null
}

function cancelEdit() {
  isEditing.value = false
  openTagMenuId.value = null
}

function spawnEffect() {
  const el = wrapRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const effect = nextEffect()
  if (effect === 'hearts') effectHearts(cx, cy)
  else if (effect === 'stars') effectStars(cx, cy)
  else effectConfetti(cx, cy)
}


function handleComplete(id: string) {
  spawnEffect()
  openCheckMenuId.value = null
  emit('complete', id)
}

function handleDoneForToday(id: string) {
  spawnEffect()
  openCheckMenuId.value = null
  emit('done-for-today', id)
}

// ── Swipe ──────────────────────────────────────────────
const swipeContainerRef = ref<HTMLElement | null>(null)
const swipeX = ref(0)
const activelySwiping = ref(false)

const SWIPE_THRESHOLD = 75
const SWIPE_MAX = 110

let touchStartX = 0
let touchStartY = 0
let swipeDir: 'horizontal' | 'vertical' | null = null

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
  swipeDir = null
}

function onTouchMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - touchStartX
  const dy = e.touches[0].clientY - touchStartY

  if (swipeDir === null) {
    if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return
    swipeDir = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
  }

  if (swipeDir !== 'horizontal') return

  e.preventDefault()
  activelySwiping.value = true
  swipeX.value = Math.max(-SWIPE_MAX, Math.min(SWIPE_MAX, dx))
}

function animateOut(type: 'fly-right' | 'puff'): Promise<void> {
  const el = swipeContainerRef.value
  if (!el) return Promise.resolve()

  if (type === 'fly-right') {
    return el.animate(
      [
        { transform: `translateX(${swipeX.value}px)`, opacity: 1 },
        { transform: 'translateX(150vw)', opacity: 0 },
      ],
      { duration: 240, easing: 'cubic-bezier(0.55, 0, 1, 0.45)', fill: 'forwards' },
    ).finished.then(() => {})
  } else {
    return el.animate(
      [
        { transform: 'scale(1)', opacity: 1 },
        { transform: 'scale(1.08)', opacity: 0.6, offset: 0.18 },
        { transform: 'scale(0)', opacity: 0 },
      ],
      { duration: 300, easing: 'ease-in', fill: 'forwards' },
    ).finished.then(() => {})
  }
}

async function onTouchEnd() {
  if (!activelySwiping.value) {
    swipeDir = null
    return
  }

  const x = swipeX.value
  swipeX.value = 0
  activelySwiping.value = false
  swipeDir = null

  if (x < -SWIPE_THRESHOLD) {
    if (props.mode === 'all') {
      await animateOut('puff')
      emit('delete', props.todo.id)
    } else {
      await animateOut('puff')
      emit('remove-from-today', props.todo.id)
    }
  } else if (x > SWIPE_THRESHOLD) {
    if (props.mode === 'all') {
      await animateOut('fly-right')
      if (!props.todo.inToday) emit('send-to-today', props.todo.id)
      else emit('remove-from-today', props.todo.id)
    } else {
      openCheckMenuId.value = props.todo.id
      swipeX.value = 0
    }
  }
}

onMounted(() => {
  swipeContainerRef.value?.addEventListener('touchmove', onTouchMove, { passive: false })
})

onUnmounted(() => {
  swipeContainerRef.value?.removeEventListener('touchmove', onTouchMove)
  if (openTagMenuId.value === props.todo.id) openTagMenuId.value = null
  if (openCheckMenuId.value === props.todo.id) openCheckMenuId.value = null
  if (titleClickTimer) clearTimeout(titleClickTimer)
})
</script>

<template>
  <div ref="wrapRef" class="todo-card-wrap" :class="{ 'tag-editing': showTagMenu }">
    <div
      ref="swipeContainerRef"
      class="swipe-container"
      :class="{ priority: isPriority, open: showMenu || showTagMenu }"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <!-- Revealed when swiping right (left-side background) -->
      <div class="swipe-bg swipe-bg--right" :class="{ active: swipeX > 30 }">
        <template v-if="mode === 'all'">
          <component :is="todo.inToday ? CircleMinus : CirclePlus" :size="18" />
          <span>{{ todo.inToday ? 'Remove' : 'Focus' }}</span>
        </template>
        <template v-else>
          <Circle :size="18" />
          <span>Complete</span>
        </template>
      </div>
      <!-- Revealed when swiping left (right-side background) -->
      <div class="swipe-bg swipe-bg--left" :class="{ active: swipeX < -30 }">
        <template v-if="mode === 'all'">
          <Trash2 :size="18" />
          <span>Delete</span>
        </template>
        <template v-else>
          <CircleMinus :size="18" />
          <span>Remove</span>
        </template>
      </div>

      <div
        class="todo-card"
        :class="{ 'has-tags': todo.tags.length, 'is-open': showMenu }"
        :style="{
          transform: `translateX(${swipeX}px)`,
          transition: activelySwiping ? 'none' : 'transform 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
        }"
      >
        <div class="todo-card-main" @click.stop="mode === 'today' ? toggleCheckMenu() : toggleTagMenu()">
          <textarea
            v-if="isEditing"
            ref="editInputRef"
            v-model="editTitle"
            class="title-input"
            rows="1"
            :style="font ? { fontFamily: font } : {}"
            @keydown.enter.prevent="acceptEdit"
            @keydown.escape="cancelEdit"
            @blur="saveEdit"
            @input="autoGrow"
            @click.stop
          />
          <span
            v-else
            class="todo-title"
            :style="font ? { fontFamily: font } : {}"
            @click.stop="handleTitleClick"
          >{{ todo.title }}</span>

          <!-- When card is open (all mode): pencil starts editing; once
               editing, it swaps to the accept/check button. -->
          <template v-if="showTagMenu && mode === 'all' && !isEditing">
            <button class="card-btn card-btn--edit" title="Edit" @click.stop="startEdit">
              <Pencil :size="10" />
            </button>
          </template>

          <!-- Saves + closes the card once editing is active. -->
          <template v-else-if="showTagMenu && mode === 'all' && isEditing">
            <button class="card-btn card-btn--edit" title="Accept" @click.stop="acceptEdit">
              <Check :size="11" />
            </button>
          </template>

          <!-- When card is closed (all mode): show original action icons -->
          <template v-else-if="mode === 'all'">
            <button
              class="card-btn card-btn--delete"
              title="Delete"
              @click.stop="emit('delete', todo.id)"
            >
              <Trash2 :size="16" />
            </button>
            <button
              v-if="!todo.inToday"
              class="card-btn"
              title="Add to focus"
              @click.stop="emit('send-to-today', todo.id)"
            >
              <CirclePlus :size="18" />
            </button>
            <button
              v-else
              class="card-btn"
              title="Remove from focus"
              @click.stop="emit('remove-from-today', todo.id)"
            >
              <CircleMinus :size="18" />
            </button>
          </template>

          <!-- Today mode: remove from today button -->
          <button
            v-else
            class="card-btn"
            title="Move back to overview"
            @click.stop="emit('remove-from-today', todo.id)"
          >
            <CircleMinus :size="18" />
          </button>
        </div>

        <div v-if="showMenu && mode === 'today'" class="check-row">
          <button class="check-opt" @click.stop="handleDoneForToday(todo.id)">
            <Clock :size="16" /> Done for today
          </button>
          <div class="check-divider" />
          <button class="check-opt" @click.stop="handleComplete(todo.id)">
            <CheckCheck :size="16" /> Done
          </button>
        </div>

        <div v-if="showTagMenu && mode === 'all'" class="tag-row" @click.stop>
          <template v-if="store.tags.length">
            <label
              v-for="tag in store.tags"
              :key="tag.id"
              class="tag-row-opt"
              :class="{ checked: todo.tags.includes(tag.id), dimmed: todo.tags.length > 0 && !todo.tags.includes(tag.id) }"
            >
              <input type="checkbox" :checked="todo.tags.includes(tag.id)" @change="updateTags(todo.tags.includes(tag.id) ? todo.tags.filter(i => i !== tag.id) : [...todo.tags, tag.id])" />
              <span>{{ tag.label }}</span>
            </label>
          </template>
          <span v-else class="tag-row-empty">No tags yet</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.todo-card-wrap {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  align-items: stretch;
  /* Leaves a sliver of breathing room above the card when scrollIntoView
     (see scrollCardIntoView) snaps its top edge to the viewport — flush
     against the edge read as jarring. */
  scroll-margin-top: 16px;
}

.swipe-container {
  position: relative;
  display: inline-flex;
  overflow: hidden;
  border-radius: var(--radius);
  border: 2px solid var(--ink);
  box-shadow: 5px 5px 0 var(--ink);
  transition: border-color 0.12s, box-shadow 0.12s, transform 0.15s;
}

/* Closed cards puff up a touch on hover — real mouse devices only (see
   other (hover: hover) blocks in this file), and skipped while open so
   the menu/edit UI underneath doesn't shift while you're using it. */
@media (hover: hover) {
  .swipe-container:not(.open):hover {
    transform: scale(1.035);
  }
}

.swipe-bg {
  position: absolute;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.03em;
  color: var(--bg);
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
  white-space: nowrap;
}

.swipe-bg.active {
  opacity: 1;
}

.swipe-bg--right {
  left: 0;
  background: var(--ink);
}

.swipe-bg--left {
  right: 0;
  background: var(--ink);
}

.todo-card {
  display: inline-flex;
  flex-direction: column;
  background: var(--bg);
  font-size: 17px;
  color: var(--ink);
  max-width: 600px;
}

/* While editing a todo's tags, the card grows to fill the row's available
   width instead of staying shrink-to-fit around the title — same idea as
   .add-tag-row's dropdown, just by widening the card itself rather than
   floating a separate overlay. Long tag labels get room to breathe and
   still truncate via .tag-row-opt's ellipsis if they exceed even that. */
.todo-card-wrap.tag-editing,
.todo-card-wrap.tag-editing .swipe-container,
.todo-card-wrap.tag-editing .todo-card {
  width: 100%;
}

/* .todo-card's own max-width:600px (below) exists to stop short-title
   cards from stretching absurdly wide on desktop — but it also caps the
   width:100% above, so on wide desktop rows the widened card stalls at
   600px instead of actually filling the row. Only lift it while editing. */
.todo-card-wrap.tag-editing .todo-card {
  max-width: none;
}

.priority {
  border-color: var(--ink);
  box-shadow: 5px 5px 0 var(--priority-shadow);
  background: var(--ink);
}

.priority .todo-card {
  background: var(--ink);
  color: var(--bg);
}

.priority .card-btn {
  color: var(--bg);
}

/* Scoped to real hover devices — on touch, :hover applies right after a
   tap and sticks until something else is tapped, so mobile action icons
   would otherwise look permanently "hovered" after use. */
@media (hover: hover) {
  .priority .card-btn:hover {
    color: var(--ink);
  }
}

.priority .check-row {
  border-top-color: var(--bg);
}

.priority .check-opt {
  background: var(--ink);
  color: var(--bg);
}

.priority .check-divider {
  background: var(--bg);
}

.priority .tag-row {
  border-top-color: var(--bg);
}

.priority .tag-row-opt {
  color: var(--bg);
  border-color: var(--bg);
}

.priority .tag-row-opt.checked {
  color: var(--bg);
  border-color: var(--bg);
}

.priority .tag-row-opt.dimmed {
  opacity: 0.35;
}

.todo-card-main {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 18px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.todo-title {
  flex: 1;
  min-width: 0;
  white-space: normal;
  word-break: break-word;
  line-height: 1.35;
}

.card-btn {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: var(--ink);
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: color 0.12s;
}

.card-btn.active { color: var(--ink-dark); }

@media (hover: hover) {
  .card-btn:hover { color: var(--ink-dark); }
}

/* Deliberately no align-self override — this sits in the exact same spot
   as the plain trash/plus/minus icons (which rely on .todo-card-main's own
   flex-start alignment), just swapped in conditionally. Sized to match
   CirclePlus's own 18px footprint. */
.card-btn--edit {
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
}

.title-input {
  display: block;
  flex: 1;
  min-width: 0;
  width: 100%;
  background: none;
  border: none;
  border-bottom: 1px solid var(--ink);
  outline: none;
  resize: none;
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: inherit;
  font-family: inherit;
  color: inherit;
  padding: 0 0 4px;
  line-height: 1.35;
}

/* Priority cards already sit on an ink-colored highlight (see .priority
   .todo-card below) — the underline needs to be the background color to
   still read against it, instead of the ink color normal cards use. */
.priority .title-input {
  border-bottom-color: var(--bg);
}

.check-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.check-opt {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px;
  background: none;
  border: none;
  font-size: 13px;
  color: var(--ink);
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.1s;
}

@media (hover: hover) {
  .check-opt:hover {
    color: var(--ink-dark);
  }
}

.check-divider {
  display: none;
  flex-shrink: 0;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 12px;
}

.tag-row-opt.dimmed {
  opacity: 0.35;
}

.tag-row-empty {
  font-size: 12px;
  color: var(--ink);
  padding: 3px 0;
}

@media (max-width: 700px) {
  .todo-card {
    font-size: 14px;
  }

  .todo-card-main {
    padding: 8px 12px;
    gap: 8px;
  }

  .card-btn {
    display: none;
  }

  .card-btn--edit {
    display: flex;
  }
}

/* Tablet: smaller/finer cards (but keep all action buttons, unlike phone)
   so several fit per row instead of the desktop-sized cards hogging space. */
@media (min-width: 701px) and (max-width: 1024px) {
  .todo-card {
    font-size: 13.5px;
    max-width: 100%;
  }

  .todo-card-main {
    padding: 7px 10px;
    gap: 6px;
  }

  .card-btn svg {
    width: 15px;
    height: 15px;
  }
}
</style>
