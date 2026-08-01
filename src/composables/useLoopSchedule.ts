import type { LoopInterval, Todo } from '../stores/todos'
import { LOOP_TAG_ID } from '../stores/todos'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function parseISODate(s: string): Date | null {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function localMidnight(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 86400000)
}

// Whether `today` is a due day. In 'once' mode that's simply "on or after
// the chosen date" — no recurrence math, and it stays due (keeps
// resurfacing) until actually completed, same as an unfinished loop todo
// would. In 'loop' mode (or legacy data predating the `mode` field, which
// always had unit+count set), counts from startDate in steps of count
// units. Month/year matching clamps to the last day of a shorter month
// (e.g. a 31st-of-the-month loop lands on the 28th/29th/30th in months
// that don't have a 31st).
export function isLoopDueToday(interval: LoopInterval, today: Date = new Date(), fallbackStart?: string): boolean {
  // Pre-dates the startDate field (loopInterval existed before it was
  // added) — fall back to whatever the caller supplies (createdAt, see
  // runLoopSchedule) instead of leaving it permanently un-due.
  const start = parseISODate(interval.startDate) ?? (fallbackStart ? parseISODate(fallbackStart) : null)
  if (!start) return false
  const t = localMidnight(today)
  if (t < start) return false

  if ((interval.mode ?? 'loop') === 'once') return true

  const count = Math.max(1, interval.count ?? 1)

  if (interval.unit === 'day') {
    return daysBetween(t, start) % count === 0
  }
  if (interval.unit === 'week') {
    return daysBetween(t, start) % (7 * count) === 0
  }
  if (interval.unit === 'month') {
    const diffMonths = (t.getFullYear() - start.getFullYear()) * 12 + (t.getMonth() - start.getMonth())
    if (diffMonths < 0 || diffMonths % count !== 0) return false
    const daysInTargetMonth = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()
    return t.getDate() === Math.min(start.getDate(), daysInTargetMonth)
  }
  // 'year'
  const diffYears = t.getFullYear() - start.getFullYear()
  if (diffYears < 0 || diffYears % count !== 0) return false
  const daysInTargetMonth = new Date(t.getFullYear(), start.getMonth() + 1, 0).getDate()
  return t.getMonth() === start.getMonth() && t.getDate() === Math.min(start.getDate(), daysInTargetMonth)
}

// Already handled today (sent to Focus today, whether that stuck — via
// "Done for today" it can be inToday:false again by now — or not) — set
// on every sendToToday(), manual or automatic. Reusing it instead of a
// dedicated field means "Done for today" earlier today correctly keeps
// this loop todo out of Focus for the rest of today, not just until the
// next scheduled check re-adds it.
function processedToday(todo: Todo): boolean {
  return !!todo.focusAddedAt && todo.focusAddedAt.slice(0, 10) === todayStr()
}

export interface LoopScheduleStore {
  todos: Todo[]
  sendToToday: (id: string) => void
}

// Sends every due, not-yet-completed loop todo to Focus — called once on
// load and again every midnight while the app stays open (see
// scheduleLoopMidnightCheck below).
export function runLoopSchedule(store: LoopScheduleStore) {
  for (const todo of store.todos) {
    if (!todo.loopInterval || !todo.tags.includes(LOOP_TAG_ID) || todo.completedAt) continue
    if (processedToday(todo)) continue
    // One malformed todo (unexpected data shape) should never stop the
    // rest of the list from being checked, or bubble up into App.vue's
    // onMounted and cut off whatever runs after it there.
    try {
      if (isLoopDueToday(todo.loopInterval, new Date(), todo.createdAt.slice(0, 10))) store.sendToToday(todo.id)
    } catch (err) {
      console.error('[loop schedule] skipping todo', todo.id, err)
    }
  }
}

// Schedules runLoopSchedule to fire right after the next local midnight,
// then reschedules itself for the one after that — covers a tab left
// open for days without a reload, not just the on-load check.
export function scheduleLoopMidnightCheck(store: LoopScheduleStore): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  function scheduleNext() {
    const now = new Date()
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5)
    timer = setTimeout(() => {
      runLoopSchedule(store)
      scheduleNext()
    }, nextMidnight.getTime() - now.getTime())
  }

  scheduleNext()
  return () => { if (timer) clearTimeout(timer) }
}
