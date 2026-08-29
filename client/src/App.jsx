import { useEffect, useState } from 'react'
import { AuthProvider } from './features/auth/AuthContext.jsx'
import { useAuth } from './features/auth/useAuth.js'
import { RegisterForm } from './features/auth/RegisterForm.jsx'
import { LoginForm } from './features/auth/LoginForm.jsx'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function BackendStatus() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch(`${API_BASE_URL}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
        return res.json()
      })
      .then((body) => {
        if (!cancelled) setHealth(body)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (error) {
    return (
      <span className="status-pill error">
        <span className="status-dot" />
        Backend unreachable: {error}
      </span>
    )
  }

  if (health) {
    return (
      <span className="status-pill">
        <span className="status-dot" />
        Backend connected — {health.data?.status ?? 'ok'}
      </span>
    )
  }

  return (
    <span className="status-pill">
      <span className="status-dot" />
      Checking backend connection…
    </span>
  )
}

function AuthenticatedView() {
  const { user, logout } = useAuth()

  return (
    <div className="welcome-card">
      <h2>Welcome, {user.name}</h2>
      <p className="auth-field-hint">@{user.username}</p>
      <button className="auth-submit" onClick={logout}>
        Log out
      </button>
    </div>
  )
}

function AppContent() {
  const { user, isLoading } = useAuth()
  const [mode, setMode] = useState('login')

  return (
    <main className="status-page">
      <h1>Cairn</h1>
      <p>Project foundation — Phase 1a: Authentication</p>

      <BackendStatus />

      {isLoading && <p>Loading…</p>}

      {!isLoading && !user && (
        <>
          {mode === 'login' ? (
            <LoginForm onSwitchToRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setMode('login')} />
          )}
        </>
      )}

      {!isLoading && user && <AuthenticatedView />}
    </main>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
