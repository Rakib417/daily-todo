import { useState } from 'react'
import { addDays, monthGrid, monthLabel, todayKey, WEEKDAYS } from '../dates'

// `counts` maps "YYYY-MM-DD" -> { total, done } so days with tasks show a dot
// and a tiny completion ring.
export default function Calendar({ selected, onSelect, counts }) {
  const [view, setView] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  const cells = monthGrid(view)
  const today = todayKey()

  function shiftMonth(n) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1))
  }

  return (
    <div className="calendar">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <span className="cal-title">{monthLabel(view)}</span>
        <button className="cal-nav" onClick={() => shiftMonth(1)} aria-label="Next month">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </button>
      </div>

      <div className="cal-grid cal-weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w} className="cal-weekday">{w}</span>
        ))}
      </div>

      <div className="cal-grid">
        {cells.map((c) => {
          const stat = counts[c.key]
          const isSelected = c.key === selected
          const isToday = c.key === today
          const pct = stat && stat.total ? stat.done / stat.total : 0
          return (
            <button
              key={c.key}
              className={[
                'cal-day',
                c.inMonth ? '' : 'muted',
                isSelected ? 'selected' : '',
                isToday ? 'today' : '',
              ].join(' ').trim()}
              onClick={() => onSelect(c.key)}
            >
              <span className="cal-num">{c.date.getDate()}</span>
              {stat && stat.total > 0 && (
                <span
                  className="cal-dot"
                  style={{
                    background: `conic-gradient(var(--green) ${pct * 360}deg, var(--accent) 0)`,
                  }}
                />
              )}
            </button>
          )
        })}
      </div>

      <button className="cal-today-btn" onClick={() => { setView(new Date(new Date().getFullYear(), new Date().getMonth(), 1)); onSelect(today) }}>
        Jump to today
      </button>
    </div>
  )
}
