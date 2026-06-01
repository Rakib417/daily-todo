import { useState } from 'react'
import { loginWithGoogle } from '../auth'
import ThemeToggle from './ThemeToggle'

export default function Login() {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleLogin() {
    setError('')
    setBusy(true)
    try {
      await loginWithGoogle()
    } catch (e) {
      if (e?.code !== 'auth/popup-closed-by-user') {
        setError(e?.message || 'Sign-in failed. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      <ThemeToggle />
      <div className="login-card">
        <div className="brand">
          <div className="brand-mark">✓</div>
          <h1>Daily</h1>
        </div>
        <p className="login-sub">
          Plan your day, track every task, and watch your week add up.
        </p>

        <button className="google-btn" onClick={handleLogin} disabled={busy}>
          <svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.3-.4-3.5z" />
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 5.1 29.5 3 24 3 16 3 9.1 7.6 6.3 14.7z" />
            <path fill="#4CAF50" d="M24 45c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 36 26.7 37 24 37c-5.3 0-9.7-2.6-11.3-7l-6.5 5C9.1 42.3 16 45 24 45z" />
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.5 36.1 45 30.6 45 24c0-1.2-.1-2.3-.4-3.5z" />
          </svg>
          {busy ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && <p className="login-error">{error}</p>}

        <p className="login-foot">
          Your tasks sync privately to your Google account.
        </p>
      </div>
    </div>
  )
}
