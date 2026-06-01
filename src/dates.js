// Local-time date helpers. We key todos by "YYYY-MM-DD" in the user's own
// timezone so a task added at 11pm belongs to that calendar day, not UTC's.

export function toKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayKey() {
  return toKey(new Date())
}

export function addDays(date, n) {
  const copy = new Date(date)
  copy.setDate(copy.getDate() + n)
  return copy
}

export function startOfWeek(date) {
  // Week starts Monday.
  const copy = new Date(date)
  const day = (copy.getDay() + 6) % 7
  copy.setDate(copy.getDate() - day)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function monthLabel(date) {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

// "Jun 1 – 7" within a month, or "Jun 29 – Jul 5" across a boundary.
export function weekRangeLabel(weekStart) {
  const end = addDays(weekStart, 6)
  const m1 = MONTHS[weekStart.getMonth()].slice(0, 3)
  const m2 = MONTHS[end.getMonth()].slice(0, 3)
  if (weekStart.getMonth() === end.getMonth()) {
    return `${m1} ${weekStart.getDate()} – ${end.getDate()}`
  }
  return `${m1} ${weekStart.getDate()} – ${m2} ${end.getDate()}`
}

// Every day in the month containing `date`, as { day, key }.
export function monthDays(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const count = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let d = 1; d <= count; d++) {
    days.push({ day: d, key: toKey(new Date(year, month, d)) })
  }
  return days
}

export function prettyDate(key) {
  const d = fromKey(key)
  const today = toKey(new Date())
  const yesterday = toKey(addDays(new Date(), -1))
  const tomorrow = toKey(addDays(new Date(), 1))
  if (key === today) return 'Today'
  if (key === yesterday) return 'Yesterday'
  if (key === tomorrow) return 'Tomorrow'
  return `${WEEKDAYS[(d.getDay() + 6) % 7]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`
}

// Build the calendar grid (6 rows x 7 cols) for the month containing `date`.
export function monthGrid(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7 // Mon-based
  const start = addDays(first, -offset)
  const cells = []
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i)
    cells.push({
      date: d,
      key: toKey(d),
      inMonth: d.getMonth() === date.getMonth(),
    })
  }
  return cells
}

export { WEEKDAYS }
