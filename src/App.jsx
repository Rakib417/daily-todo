import { useAuth } from './auth'
import { isFirebaseConfigured } from './firebase'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

export default function App() {
  const { user, loading } = useAuth()

  if (!isFirebaseConfigured) {
    return (
      <div className="login">
        <div className="login-card">
          <div className="brand">
            <div className="brand-mark">✓</div>
            <h1>Daily Todo List</h1>
          </div>
          <p className="login-sub">Almost there — Firebase isn’t configured yet.</p>
          <div className="setup-note">
            <p>Create a <code>.env</code> file from <code>.env.example</code> and add your
              Firebase web-app keys, then restart <code>npm run dev</code>.</p>
            <p>See <code>SETUP.md</code> for the step-by-step guide.</p>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="login">
        <div className="spinner" />
      </div>
    )
  }

  return user ? <Dashboard /> : <Login />
}
