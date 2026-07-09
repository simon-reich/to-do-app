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
import { ref, computed, watch, nextTick, onUnmounted } from 'vue'
import { CirclePlus, CircleMinus, Trash2, CheckCheck, Clock, Pencil, Check } from '@lucide/vue'
import { motion, useMotionValue, useTransform, useMotionValueEvent, animate, type PanInfo } from 'motion-v'
import { useTodosStore, type Todo, PRIORITY_TAG_ID } from '../stores/todos'

const props = defineProps<{
  todo: Todo
  mode: 'all' | 'today'
  font?: string
}>()

const store = useTodosStore()

const isPriority = computed(() => props.todo.tags.includes(PRIORITY_TAG_ID))


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
  const willOpen = openCheckMenuId.value !== props.todo.id
  openCheckMenuId.value = willOpen ? props.todo.id : null
  if (willOpen) nextTick(scrollCardIntoView)
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
  openCheckMenuId.value = null
  const willOpen = openTagMenuId.value !== props.todo.id
  openTagMenuId.value = willOpen ? props.todo.id : null
  if (!willOpen && isEditing.value) saveEdit()
  if (willOpen) nextTick(scrollCardIntoView)
}

// Clicking the empty space between tag chips (not a chip itself) closes the
// card, same as clicking the title bar again would.
function handleTagRowClick(e: MouseEvent) {
  if (e.target === e.currentTarget) toggleTagMenu()
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
// `drag="x"` keeps touch-action: pan-y, so Motion itself makes the
// scroll-vs-drag call the instant a touch starts, based on its initial
// direction — a mostly-vertical gesture is left alone and scrolls the list
// natively; a mostly-horizontal one is claimed as a drag. Only once Motion
// has already committed to "this is a drag" do we manually mirror the
// pointer's vertical offset onto `y` too (see onDrag/DRAG_ENGAGE_THRESHOLD),
// so the card still follows the finger freely in every direction — without
// ever having to fight the browser for scroll ownership.
const swipeContainerRef = ref<HTMLElement | null>(null)
const x = useMotionValue(0)
const y = useMotionValue(0)
const rotate = useTransform(x, [-200, 200], [-8, 8])
// Raw mirrors of physical position (used for the elevated z-index / lifted
// state only — that has to reflect the actual on-screen offset, not the
// relative swipe measurement below). Derived directly from position rather
// than tracked drag-start/drag-end bookkeeping, so it stays correct even if
// a gesture gets interrupted (pointercancel, direction handed to native
// scroll mid-drag, etc.) without a clean onDragEnd.
const swipeX = ref(0)
const swipeY = ref(0)

// A clean 3-state machine along the horizontal axis: Hold (armedDir 0),
// armed-right (1), armed-left (-1). `refX` is the reference point for
// whichever state is currently active, and `swipeRelX` is the live offset
// from it. It's a *fixed* point for the duration of a state — it only ever
// moves at the exact moment of falling back into Hold, where it re-baselines
// to wherever that happened. From there, reaching either armed state again
// needs the full ARM_DISTANCE once more, in either direction — Hold is a
// real, equally-sized zone of its own, not just a wedge you pass through.
//
// `extremeX` tracks the furthest point reached in the current excursion —
// release is measured back from *that peak*, not from refX/the original
// grip start. Without this, dragging out far past the arm threshold before
// pulling back meant the release check (relative to the far-away start)
// barely moved before crossing, needing an enormous pull-back — while a
// swipe that armed right at the threshold released after only a small one.
const swipeRelX = ref(0)
let refX = 0
let extremeX = 0

// Distance from Hold's reference point needed to arm a direction — same
// both ways, so delete and move/complete need identical travel. This is
// also the width of the Hold zone you land back in after releasing an
// armed state, so it needs real, comfortably perceivable room — too tight
// and a normal-speed swipe blows straight through it in a frame or two.
const ARM_DISTANCE = 130
// How far back from the current excursion's peak counts as "given up on
// this direction" — deliberately small relative to ARM_DISTANCE, so once
// armed it stays armed through minor jitter, but a real, deliberate
// pull-back drops it back to a fresh Hold zone. Always measured from the
// peak, so it's the same small pull-back regardless of how far past the
// threshold the swipe went.
const RELEASE_MARGIN = 45

// The one authoritative "what would happen on release" state — the reveal
// indicator and the actual onDragEnd decision both read this directly, so
// what you see is always exactly what fires.
const armedDir = ref<-1 | 0 | 1>(0)

// Horizontal distance (from the grip's start, not the relative measurement
// above) before the vertical follow kicks in — small enough to feel
// instant, but enough to stay clear of Motion's own direction-lock tolerance
// (so we never turn on a y-follow for what was actually a scroll).
const DRAG_ENGAGE_THRESHOLD = 10
const SPRING_BACK = { type: 'spring', stiffness: 500, damping: 32 } as const

// Lifted above every sibling card and the sticky header/bottom-nav for as
// long as the card is visibly off-center — see the .dragging CSS comment.
const isLifted = computed(() => swipeX.value !== 0 || swipeY.value !== 0)

useMotionValueEvent(x, 'change', (latest) => {
  swipeX.value = latest
})
useMotionValueEvent(y, 'change', (latest) => {
  swipeY.value = latest
})

// One haptic tick exactly when the armed state changes (arms or disarms) —
// not on every threshold-adjacent wobble.
watch(armedDir, (dir, prev) => {
  if (dir !== prev) navigator.vibrate?.(dir === 0 ? 8 : 12)
})

// Disabled while a menu/edit UI underneath is in use, so drag gestures don't
// fight with taps on checkboxes/buttons revealed by the open card.
const canDrag = computed(() => !isEditing.value && !showTagMenu.value && !showMenu.value)

// What-would-happen indicator, shown centered over the whole page (via
// Teleport) instead of pinned to the card — it now needs to stay legible and
// on top of everything no matter where a free-form drag has carried the card.
// Tied directly to `armedDir` (the same authoritative state onDragEnd reads)
// rather than its own separate preview threshold: an earlier version showed
// a preview once past ~32px, computed independently from the 24px margin
// that moves the reference point — on an ordinary, non-glacial swipe, a
// single drag frame easily covers more than the ~8px gap between those two,
// so the neutral state got skipped over almost every time. Showing "Hold"
// for the entire pre-arm range (0–45px, not just a wedge of it) sidesteps
// that entirely and gives a genuinely large, robust neutral zone.
const swipeAction = computed(() => {
  if (armedDir.value === 1) {
    return props.mode === 'all'
      ? { label: props.todo.inToday ? 'Remove' : 'Focus' }
      : { label: 'Complete' }
  }
  if (armedDir.value === -1) {
    return props.mode === 'all' ? { label: 'Delete' } : { label: 'Remove' }
  }
  return { label: 'Hold' }
})
const swipeArmed = computed(() => armedDir.value !== 0)

function animateOut(type: 'fly-right' | 'puff'): Promise<void> {
  const el = swipeContainerRef.value
  if (!el) return Promise.resolve()

  if (type === 'fly-right') {
    return el.animate(
      [
        { transform: el.style.transform, opacity: 1 },
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

// touch-action: pan-y means the browser is *allowed* to natively scroll the
// list at the same time Motion is handling our horizontal drag — on a
// diagonal-enough gesture both can end up running at once (card dragging
// while the list scrolls underneath it). Once Motion has actually committed
// to a drag, we lock the nearest scrollable ancestor's own scrolling for the
// duration, so gripping a card unambiguously owns the gesture.
//
// Pull-to-refresh is a separate, page-level overscroll-chaining gesture and
// can't be locked reactively here the same way: the browser decides whether
// to hand a touch to native pull-to-refresh right at touchstart, before any
// of this component's JS has run, so a fast downward drag can trigger it
// before onDragStart even fires. That's instead fixed permanently via
// `overscroll-behavior-y: contain` on .main-content (see layout.css), which
// stops the chaining at the CSS level from the very first touch, every time.
let scrollLockEl: HTMLElement | null = null

function lockScroll() {
  let node = swipeContainerRef.value?.parentElement ?? null
  while (node && node !== document.body) {
    if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) {
      scrollLockEl = node
      node.style.overflowY = 'hidden'
      return
    }
    node = node.parentElement
  }
}

function unlockScroll() {
  if (scrollLockEl) {
    scrollLockEl.style.overflowY = ''
    scrollLockEl = null
  }
}

// Safety net: if the gesture ever ends without Motion calling onDragEnd
// (a stray pointercancel, the tab losing focus mid-drag, etc.), the lock
// above would otherwise stay stuck forever — leaving .main-content
// permanently unscrollable, breaking things as unrelated as the
// scroll-into-view on opening the edit textarea. Same story for `isGripped`:
// stuck true would leave the card permanently position:fixed. Any pointer
// going up or cancelling anywhere always releases both, regardless of how
// the drag ended.
function releaseGripFallback() {
  unlockScroll()
  isGripped.value = false
  window.removeEventListener('pointerup', releaseGripFallback)
  window.removeEventListener('pointercancel', releaseGripFallback)
}

function armGripSafetyNet() {
  window.addEventListener('pointerup', releaseGripFallback, { once: true })
  window.addEventListener('pointercancel', releaseGripFallback, { once: true })
}

// `.main-content` (and similar scrollable ancestors) clip anything that's
// dragged past their own box edges via their own overflow — no z-index can
// out-rank that, it's a completely separate clipping mechanism. So while
// actually gripped, the card's wrapper switches to position:fixed at its
// current on-screen spot (escaping that clipping and any ancestor stacking
// entirely — it now paints at the true top of the page) and only returns to
// normal flow the instant the grip ends. Scroll is locked for the whole
// gripped duration anyway, so there's no risk of the fixed card drifting out
// of sync with a list that's scrolling underneath it.
const isGripped = ref(false)
const fixedOrigin = ref<{ top: number; left: number; width: number } | null>(null)

function onDragStart() {
  releaseGripFallback() // in case a previous gesture didn't clean up
  lockScroll()
  armGripSafetyNet()
  isGripped.value = true
  refX = 0
  extremeX = 0
  armedDir.value = 0
  swipeRelX.value = 0
  const rect = wrapRef.value?.getBoundingClientRect()
  if (rect) fixedOrigin.value = { top: rect.top, left: rect.left, width: rect.width }
}

function onDrag(_event: PointerEvent, info: PanInfo) {
  const rawX = info.offset.x
  const rel = rawX - refX
  if (Math.abs(rel) > Math.abs(extremeX - refX)) extremeX = rawX

  if (armedDir.value === 0) {
    if (rel > ARM_DISTANCE) armedDir.value = 1
    else if (rel < -ARM_DISTANCE) armedDir.value = -1
  } else {
    const peakRel = extremeX - refX
    const released =
      (armedDir.value === 1 && rel < peakRel - RELEASE_MARGIN) ||
      (armedDir.value === -1 && rel > peakRel + RELEASE_MARGIN)
    if (released) {
      // Falls back to Hold — wherever that happens becomes the fresh
      // reference point, so reaching either armed state again needs the
      // full ARM_DISTANCE from here, not a discount for distance already
      // covered before this release.
      refX = rawX
      extremeX = rawX
      armedDir.value = 0
    }
  }

  swipeRelX.value = rawX - refX

  if (Math.abs(rawX) > DRAG_ENGAGE_THRESHOLD) {
    y.set(info.offset.y)
  }
}

function springBackToCenter() {
  animate(x, 0, SPRING_BACK)
  animate(y, 0, SPRING_BACK)
}

// Reads the same `armedDir` the indicator itself displays — whatever it was
// showing on screen the instant the finger lifts is exactly what fires,
// vertical movement never factors in, and it never fires mid-gesture.
async function onDragEnd(_event: PointerEvent, _info: PanInfo) {
  window.removeEventListener('pointerup', releaseGripFallback)
  window.removeEventListener('pointercancel', releaseGripFallback)
  unlockScroll()
  isGripped.value = false
  const swipedLeft = armedDir.value === -1
  const swipedRight = armedDir.value === 1
  refX = 0
  extremeX = 0
  armedDir.value = 0
  swipeRelX.value = 0

  if (swipedLeft) {
    x.set(0)
    y.set(0)
    if (props.mode === 'all') {
      // Delete is permanent and the swipe to trigger it is quick — easy to
      // cross by accident. Confirm first, same as deleting a tag; the puff
      // animation only plays once that's actually confirmed.
      pendingDelete.value = true
    } else {
      await animateOut('puff')
      emit('remove-from-today', props.todo.id)
    }
  } else if (swipedRight) {
    if (props.mode === 'all') {
      x.set(0)
      y.set(0)
      await animateOut('fly-right')
      if (!props.todo.inToday) emit('send-to-today', props.todo.id)
      else emit('remove-from-today', props.todo.id)
    } else {
      openCheckMenuId.value = props.todo.id
      springBackToCenter()
    }
  } else {
    springBackToCenter()
  }
}

// Confirmation for a swipe-triggered delete (see onDragEnd) — mirrors the
// tag-delete confirmation modal in App.vue, same markup/classes/style.
const pendingDelete = ref(false)

async function confirmSwipeDelete() {
  pendingDelete.value = false
  await animateOut('puff')
  emit('delete', props.todo.id)
}

function cancelSwipeDelete() {
  pendingDelete.value = false
}

onUnmounted(() => {
  window.removeEventListener('pointerup', releaseGripFallback)
  window.removeEventListener('pointercancel', releaseGripFallback)
  unlockScroll()
  if (openTagMenuId.value === props.todo.id) openTagMenuId.value = null
  if (openCheckMenuId.value === props.todo.id) openCheckMenuId.value = null
  if (titleClickTimer) clearTimeout(titleClickTimer)
})
</script>

<template>
  <div
    ref="wrapRef"
    class="todo-card-wrap"
    :class="{ 'tag-editing': showTagMenu, dragging: isLifted }"
    :style="isGripped && fixedOrigin ? {
      position: 'fixed',
      top: fixedOrigin.top + 'px',
      left: fixedOrigin.left + 'px',
      width: fixedOrigin.width + 'px',
      zIndex: 9999,
    } : undefined"
  >
    <div
      ref="swipeContainerRef"
      class="swipe-container"
      :class="{ open: showMenu || showTagMenu }"
    >
      <Teleport to="body">
        <Transition name="swipe-indicator">
          <span
            v-if="isGripped"
            class="swipe-indicator"
            :class="{ armed: swipeArmed }"
          >{{ swipeAction.label }}</span>
        </Transition>
      </Teleport>

      <Teleport to="body">
        <template v-if="pendingDelete">
          <div class="modal-backdrop" @click="cancelSwipeDelete" />
          <div class="modal-box" role="dialog">
            <p class="modal-text">Delete <strong>{{ todo.title }}</strong>?</p>
            <div class="modal-actions">
              <button class="modal-btn modal-btn--cancel" @click="cancelSwipeDelete">Cancel</button>
              <button class="modal-btn modal-btn--delete" @click="confirmSwipeDelete">Delete</button>
            </div>
          </div>
        </template>
      </Teleport>

      <motion.div
        class="todo-card"
        :class="{ 'has-tags': todo.tags.length, 'is-open': showMenu, priority: isPriority }"
        :style="{ x, y, rotate }"
        :drag="canDrag ? 'x' : false"
        :drag-momentum="false"
        :while-drag="{ scale: 1.05 }"
        @drag-start="onDragStart"
        @drag="onDrag"
        @drag-end="onDragEnd"
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
          <button class="check-opt" @click.stop="handleComplete(todo.id)">
            <CheckCheck :size="16" /> Done
          </button>
        </div>

        <div v-if="showTagMenu && mode === 'all'" class="tag-row" @click.stop="handleTagRowClick">
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
      </motion.div>
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

/* Lifts the gripped card above every sibling card (which would otherwise
   paint over it per normal DOM order) and above the sticky mobile header /
   bottom nav (both z-index: 20, see mobile.css) while it's being dragged
   around freely. */
.todo-card-wrap.dragging {
  z-index: 25;
}

/* No overflow:hidden here — the dragged card must stay fully visible while
   it's pulled past the reveal panels, instead of getting clipped away at the
   container edge (which reads as if the delete already fired mid-drag). */
.swipe-container {
  position: relative;
  display: inline-flex;
  transition: transform 0.15s;
}

/* Closed cards puff up a touch on hover — real mouse devices only (see
   other (hover: hover) blocks in this file), and skipped while open so
   the menu/edit UI underneath doesn't shift while you're using it. */
@media (hover: hover) {
  .swipe-container:not(.open):hover {
    transform: scale(1.035);
  }
}

/* What-would-happen indicator (see swipeAction/swipeArmed) — teleported to
   body so it always paints centered over the page, not tucked next to
   whichever card happens to be dragged. Deliberately just dimmed type, no
   box/border/icon — reads as ambient background text rather than a UI
   element sitting on top of things. Sits above ordinary list content so
   it's legible, but below the actively-gripped card itself (z-index: 9999,
   see the wrapper's fixedOrigin style), which is always meant to read as
   being in front of it. Only the opacity (never a new colour) distinguishes
   "just previewing" from "this will fire on release", per the app's
   dimming-via-opacity rule. */
.swipe-indicator {
  position: fixed;
  top: 42%;
  left: 50%;
  z-index: 60;
  color: var(--ink);
  opacity: 0.35;
  font-size: 22px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  pointer-events: none;
  transform: translate(-50%, -50%);
  transition: opacity 0.15s, font-size 0.15s;
}

.swipe-indicator.armed {
  opacity: 1;
  font-size: 26px;
}

.swipe-indicator-enter-active,
.swipe-indicator-leave-active {
  transition: opacity 0.12s ease;
}

.swipe-indicator-enter-from,
.swipe-indicator-leave-to {
  opacity: 0;
}

.todo-card {
  display: inline-flex;
  flex-direction: column;
  background: var(--bg);
  font-size: 17px;
  color: var(--ink);
  max-width: 600px;
  border-radius: var(--radius);
  border: 2px solid var(--ink);
  box-shadow: 5px 5px 0 var(--ink);
  overflow: hidden;
  transition: border-color 0.12s, box-shadow 0.12s;
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

.todo-card.priority {
  border-color: var(--ink);
  box-shadow: 5px 5px 0 var(--priority-shadow);
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
