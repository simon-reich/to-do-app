import { useTodosStore } from '../stores/todos'

function getToday4amISO(): string {
  const now = new Date()
  const reset = new Date(now)
  reset.setHours(4, 0, 0, 0)
  // if current time is before 4am, reset threshold is yesterday's 4am
  if (now < reset) reset.setDate(reset.getDate() - 1)
  return reset.toISOString().slice(0, 10)
}

export function useReset() {
  function checkAndReset() {
    const store = useTodosStore()
    const threshold = getToday4amISO()
    if (store.lastResetDate < threshold) {
      store.resetToday()
    }
  }

  return { checkAndReset }
}
