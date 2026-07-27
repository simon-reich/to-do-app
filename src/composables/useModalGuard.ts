import { ref } from 'vue'

export interface ModalGuard {
  onCancel: () => void
  onConfirm?: () => void
}

// Whichever confirmation modal is currently open (delete-todo, delete-tag,
// loop's start-date picker, ...) registers itself here. A single source of
// truth lets App.vue's one global keydown listener enforce one rule for
// all of them: Escape always cancels, Enter always confirms, and nothing
// else (Tab-cycling, single-letter shortcuts, a card's own Escape/Enter
// handling) gets through underneath while a modal is up.
export const activeModal = ref<ModalGuard | null>(null)
