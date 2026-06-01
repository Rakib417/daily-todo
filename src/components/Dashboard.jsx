import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth, logout } from '../auth'
import { addTodo, removeTodo, setDone, subscribeTodos } from '../todos'
import { ensureProfile, setNotify } from '../users'
import { prettyDate, todayKey } from '../dates'
import Calendar from './Calendar'
import WeeklyChart from './WeeklyChart'
import ThemeToggle from './ThemeToggle'

export default function Dashboard() {
  const { user } = useAuth()
  const [todos, setTodos] = useState([])
  const [selected, setSelected] = useState(todayKey())
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notify, setNotifyState] = useState(true)
  // Mirror of `notify` updated synchronously, so rapid clicks always toggle
  // from the latest value instead of a stale render closure.
  const notifyRef = useRef(true)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const unsub = subscribeTodos(
      user.uid,
      (items) => {
        setTodos(items)
        setLoading(false)
      },
      (e) => {
        setError(e?.message || 'Could not load your tasks.')
        setLoading(false)
      },
    )
    // Create/refresh the profile doc and load the notification preference.
    ensureProfile(user)
      .then((p) => {
        const on = p?.notify !== false
        notifyRef.current = on
        setNotifyState(on)
      })
      .catch(() => {})
    return unsub
  }, [user])

  async function toggleNotify() {
    const next = !notifyRef.current
    notifyRef.current = next
    setNotifyState(next)
    setError('')
    try {
      await setNotify(user.uid, next)
    } catch (err) {
      notifyRef.current = !next
      setNotifyState(!next)
      setError(err?.message || 'Could not update notification setting.')
    }
  }

  // Per-day counts for the calendar dots.
  const counts = useMemo(() => {
    const map = {}
    for (const t of todos) {
      const c = map[t.date] || (map[t.date] = { total: 0, done: 0 })
      c.total += 1
      if (t.done) c.done += 1
    }
    return map
  }, [todos])

  const dayTodos = useMemo(
    () => todos.filter((t) => t.date === selected),
    [todos, selected],
  )
  const remaining = dayTodos.filter((t) => !t.done).length

  async function handleAdd(e) {
    e.preventDefault()
    const title = text.trim()
    if (!title || !user) return
    setError('')
    try {
      await addTodo(user.uid, title, selected)
      // Only clear the input once the write succeeds, so a failed add doesn't
      // make the user lose what they typed.
      setText('')
    } catch (err) {
      setError(err?.message || 'Could not add task.')
    }
  }

  // Firestore's onSnapshot already applies the change to the local cache
  // instantly (latency compensation) and auto-reverts a rejected write, so we
  // let the subscription drive the UI rather than mutating state by hand.
  async function toggleTodo(t) {
    setError('')
    try {
      await setDone(user.uid, t.id, !t.done)
    } catch (err) {
      setError(err?.message || 'Could not update task.')
    }
  }

  async function deleteTodo(id) {
    setError('')
    try {
      await removeTodo(user.uid, id)
    } catch (err) {
      setError(err?.message || 'Could not delete task.')
    }
  }

  return (
    <div className="dash">
      <header className="topbar">
        <div className="brand-sm">
          <div className="brand-mark sm">✓</div>
          <span>Daily Todo List</span>
        </div>
        <div className="user">
          {user?.photoURL && <img src={user.photoURL} alt="" referrerPolicy="no-referrer" />}
          <span className="user-name">{user?.displayName || user?.email}</span>
          <ThemeToggle />
          <button className="logout" onClick={logout}>Sign out</button>
        </div>
      </header>

      {error && (
        <div className="banner error">
          <span>{error}</span>
          <button className="banner-close" onClick={() => setError('')} aria-label="Dismiss">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      <div className="grid">
        <section className="col-main">
          <div className="day-head">
            <div>
              <h1>{prettyDate(selected)}</h1>
              <p className="day-sub">
                {dayTodos.length === 0
                  ? 'No tasks yet for this day.'
                  : remaining === 0
                    ? 'All done — great job! 🎉'
                    : `${remaining} of ${dayTodos.length} left`}
              </p>
            </div>
          </div>

          <form className="add" onSubmit={handleAdd}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Add a task for ${prettyDate(selected).toLowerCase()}…`}
            />
            <button type="submit" aria-label="Add task">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            </button>
          </form>

          {loading ? (
            <div className="skeletons">
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" />)}
            </div>
          ) : dayTodos.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">✓</div>
              <p>Nothing planned. Add your first task above.</p>
            </div>
          ) : (
            <ul className="list">
              {dayTodos.map((t) => (
                <li key={t.id} className={t.done ? 'done' : ''}>
                  <button className="check" onClick={() => toggleTodo(t)} aria-label="Toggle done">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  </button>
                  <span className="title">{t.title}</span>
                  <button className="remove" onClick={() => deleteTodo(t.id)} aria-label="Delete task">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="col-side">
          <Calendar selected={selected} onSelect={setSelected} counts={counts} />
          <WeeklyChart todos={todos} />
          <div className="notify-card">
            <div className="notify-text">
              <span className="notify-title">Daily email summary</span>
              <span className="notify-sub">Get your completion stats emailed each evening.</span>
            </div>
            <button
              className={`toggle ${notify ? 'on' : ''}`}
              onClick={toggleNotify}
              role="switch"
              aria-checked={notify}
              aria-label="Toggle daily email summary"
            >
              <span className="knob" />
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
