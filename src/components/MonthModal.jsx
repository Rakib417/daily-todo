import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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
import { monthDays, monthLabel } from '../dates'

export default function MonthModal({ todos, onClose }) {
  const [view, setView] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })

  // Close on Escape.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const { data, totalCreated, totalDone, avg, activeDays } = useMemo(() => {
    const counts = {}
    for (const t of todos) {
      const c = counts[t.date] || (counts[t.date] = { created: 0, done: 0 })
      c.created += 1
      if (t.done) c.done += 1
    }
    let created = 0
    let done = 0
    let active = 0
    const rows = monthDays(view).map(({ day, key }) => {
      const s = counts[key] || { created: 0, done: 0 }
      created += s.created
      done += s.done
      if (s.created > 0) active += 1
      return { day, created: s.created, done: s.done, rate: s.created ? Math.round((s.done / s.created) * 100) : 0 }
    })
    return {
      data: rows,
      totalCreated: created,
      totalDone: done,
      avg: created ? Math.round((done / created) * 100) : 0,
      activeDays: active,
    }
  }, [todos, view])

  const shiftMonth = (n) => setView((v) => new Date(v.getFullYear(), v.getMonth() + n, 1))

  // Render at the document root so the fixed overlay isn't trapped by the
  // chart card's backdrop-filter (which would confine it to the card).
  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-month-nav">
            <button className="cal-nav" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <h2>{monthLabel(view)}</h2>
            <button className="cal-nav" onClick={() => shiftMonth(1)} aria-label="Next month">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="modal-stats">
          <div className="stat">
            <span className="stat-num">{totalCreated}</span>
            <span className="stat-label">Created</span>
          </div>
          <div className="stat">
            <span className="stat-num green">{totalDone}</span>
            <span className="stat-label">Completed</span>
          </div>
          <div className="stat">
            <span className="stat-num gradient">{avg}%</span>
            <span className="stat-label">Avg done</span>
          </div>
          <div className="stat">
            <span className="stat-num">{activeDays}</span>
            <span className="stat-label">Active days</span>
          </div>
        </div>

        <div className="modal-chart">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="mBarCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c5cff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#4f8cff" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
              <XAxis dataKey="day" interval={2} tick={{ fill: '#8b97b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="count" allowDecimals={false} tick={{ fill: '#8b97b0', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rate" domain={[0, 100]} hide />
              <Tooltip
                cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                contentStyle={{ background: '#131a33', border: '1px solid rgba(148,163,184,0.2)', borderRadius: 12, color: '#f1f5f9', fontSize: 13 }}
                labelFormatter={(d) => `Day ${d}`}
                formatter={(value, name) => {
                  if (name === 'rate') return [`${value}%`, 'Completion']
                  return [value, name === 'created' ? 'Created' : 'Done']
                }}
              />
              <Bar yAxisId="count" dataKey="created" fill="url(#mBarCreated)" radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Bar yAxisId="count" dataKey="done" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={18} />
              <Line yAxisId="rate" type="monotone" dataKey="rate" stroke="#fbbf24" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-legend">
          <span><i className="dot dot-purple" /> Created</span>
          <span><i className="dot dot-green" /> Done</span>
          <span><i className="dot dot-amber" /> Completion %</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
