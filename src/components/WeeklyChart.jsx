import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { addDays, startOfWeek, toKey, weekRangeLabel } from '../dates'
import MonthModal from './MonthModal'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ChevronLeft = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
)
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
)

// Per-day created/done/rate stats for a 7-day window starting at weekStart.
function weekStats(todos, weekStart) {
  const byDay = {}
  for (let i = 0; i < 7; i++) byDay[toKey(addDays(weekStart, i))] = { created: 0, done: 0 }
  for (const t of todos) {
    if (byDay[t.date]) {
      byDay[t.date].created += 1
      if (t.done) byDay[t.date].done += 1
    }
  }
  let created = 0
  let done = 0
  const rows = DAY_LABELS.map((label, i) => {
    const s = byDay[toKey(addDays(weekStart, i))]
    created += s.created
    done += s.done
    return { day: label, created: s.created, done: s.done, rate: s.created ? Math.round((s.done / s.created) * 100) : 0 }
  })
  return { data: rows, avg: created ? Math.round((done / created) * 100) : 0, totalCreated: created, totalDone: done }
}

export default function WeeklyChart({ todos }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [monthOpen, setMonthOpen] = useState(false)
  // Recompute "is this the current week?" when the tab regains focus, so the
  // label and reset button stay correct across a midnight/week rollover.
  const [tick, setTick] = useState(0)
  useEffect(() => {
    const refresh = () => { if (!document.hidden) setTick((n) => n + 1) }
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  const isThisWeek = useMemo(
    () => toKey(weekStart) === toKey(startOfWeek(new Date())),
    [weekStart, tick],
  )
  const { data, avg, totalCreated, totalDone } = useMemo(
    () => weekStats(todos, weekStart),
    [todos, weekStart],
  )

  return (
    <div className="chart-card">
      <div className="chart-head">
        <div>
          <div className="chart-title-row">
            <button className="cal-nav sm" onClick={() => setWeekStart((w) => addDays(w, -7))} aria-label="Previous week">
              <ChevronLeft />
            </button>
            <h2>{isThisWeek ? 'This week' : weekRangeLabel(weekStart)}</h2>
            <button className="cal-nav sm" onClick={() => setWeekStart((w) => addDays(w, 7))} aria-label="Next week">
              <ChevronRight />
            </button>
          </div>
          <p className="chart-sub">{totalDone} of {totalCreated} tasks completed</p>
        </div>
        <div className="chart-avg">
          <span className="chart-avg-num">{avg}%</span>
          <span className="chart-avg-label">avg done</span>
        </div>
      </div>

      <div className="chart-body">
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="barCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#4f8cff" stopOpacity="0.5" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#8b97b0', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="count" allowDecimals={false} tick={{ fill: '#8b97b0', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="rate" domain={[0, 100]} hide />
            <Tooltip
              cursor={{ fill: 'rgba(148,163,184,0.08)' }}
              contentStyle={{ background: '#131a33', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, color: '#f1f5f9', fontSize: 13 }}
              formatter={(value, name) => {
                if (name === 'rate') return [`${value}%`, 'Completion']
                return [value, name === 'created' ? 'Created' : 'Done']
              }}
            />
            <Bar yAxisId="count" dataKey="created" fill="url(#barCreated)" radius={[5, 5, 0, 0]} maxBarSize={26} />
            <Bar yAxisId="count" dataKey="done" fill="#34d399" radius={[5, 5, 0, 0]} maxBarSize={26} />
            <Line yAxisId="rate" type="monotone" dataKey="rate" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 3, fill: '#fbbf24' }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend">
        <span><i className="dot dot-purple" /> Created</span>
        <span><i className="dot dot-green" /> Done</span>
        <span><i className="dot dot-amber" /> Completion %</span>
      </div>

      <div className="chart-footer">
        {!isThisWeek && (
          <button className="link-btn" onClick={() => setWeekStart(startOfWeek(new Date()))}>
            ← Back to this week
          </button>
        )}
        <button className="link-btn month-btn" onClick={() => setMonthOpen(true)}>
          View full month →
        </button>
      </div>

      {monthOpen && <MonthModal todos={todos} onClose={() => setMonthOpen(false)} />}
    </div>
  )
}
