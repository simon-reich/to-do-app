<script setup lang="ts">
import { onUnmounted } from 'vue'
import { useChecksStore, type Check } from '../stores/checks'
import { activeModal } from '../composables/useModalGuard'

const emit = defineEmits<{ close: []; edit: [check: Check] }>()

const store = useChecksStore()

function close() {
  emit('close')
}

function edit(check: Check) {
  emit('edit', check)
}

// Same app-wide modal guard every other overlay uses — Escape closes this,
// no Enter action (there's no single primary action here, just browsing),
// same as e.g. the delete-tag confirm not needing one either.
activeModal.value = { onCancel: close }
onUnmounted(() => {
  if (activeModal.value?.onCancel === close) activeModal.value = null
})
</script>

<template>
  <div class="modal-backdrop" @click="close" />
  <div class="modal-box all-checks-box" role="dialog" @click.stop>
    <h2 class="all-checks-title">checks</h2>

    <!-- Every check, not just today's due ones (see Focus.vue's own
         checksStore.todayChecks row) — this is the only place a check
         that isn't currently due can be reached to edit or delete at all.
         Clicking a row reuses CheckModal (Focus.vue swaps this overlay for
         it), which already has both Save and Delete — no need to
         duplicate either action here. -->
    <div v-if="store.activeChecks.length" class="all-checks-list">
      <button
        v-for="check in store.activeChecks"
        :key="check.id"
        type="button"
        class="all-checks-card"
        @click="edit(check)"
      >
        {{ check.title }}
      </button>
    </div>
    <p v-else class="all-checks-empty">No checks yet.</p>

    <div class="modal-actions">
      <button class="modal-btn modal-btn--cancel" @click="close">close</button>
    </div>
  </div>
</template>

<style scoped>
.all-checks-box {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* Extra separation from the card grid above it — set apart rather than
   just the next item in the same stack, matching the "kept apart" request
   for this specific button. */
.all-checks-box .modal-actions {
  margin-top: 10px;
}

@media (min-width: 701px) {
  .all-checks-box {
    width: 380px;
  }
}

@media (max-width: 700px) {
  .all-checks-box {
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
  }
}

.all-checks-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--ink-dark);
  font-family: var(--font-mono, monospace);
}

/* Small cards in a wrapping grid, same idea as AllTodos.vue's own grid
   mode — reads as "the same kind of thing as a todo", just Check-sized,
   instead of a divided list. */
.all-checks-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  max-height: 50vh;
  overflow-y: auto;
  padding: 2px;
  scrollbar-width: none;
}

.all-checks-list::-webkit-scrollbar {
  display: none;
}

.all-checks-card {
  max-width: 100%;
  padding: 9px 14px;
  border: 2px solid var(--ink);
  border-radius: var(--radius);
  box-shadow: 3px 3px 0 var(--ink);
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-mono, monospace);
  font-size: 14px;
  font-weight: 600;
  text-align: left;
  word-break: break-word;
  cursor: pointer;
  transition: border-color 0.12s, box-shadow 0.12s;
}

@media (hover: hover) {
  .all-checks-card:hover {
    border-color: var(--ink-dark);
    box-shadow: 3px 3px 0 var(--ink-dark);
  }
}

.all-checks-empty {
  font-size: 14px;
  color: var(--ink);
  opacity: 0.6;
  text-align: center;
}
</style>
