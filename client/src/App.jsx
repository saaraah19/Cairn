import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext.jsx'
import { useAuth } from './features/auth/useAuth.js'
import { RegisterForm } from './features/auth/RegisterForm.jsx'
import { LoginForm } from './features/auth/LoginForm.jsx'
import { AuthLayout } from './layouts/AuthLayout.jsx'
import { AppShell } from './layouts/AppShell.jsx'
import { LoadingState } from './components/LoadingState.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { MyOutdoorsPage } from './pages/MyOutdoorsPage.jsx'
import { GearPage } from './pages/GearPage.jsx'
import { StatisticsPage } from './pages/StatisticsPage.jsx'
import { ProfilePage } from './pages/ProfilePage.jsx'
import { ActivityCreatePage } from './features/activities/ActivityCreatePage.jsx'
import { ActivityEditPage } from './features/activities/ActivityEditPage.jsx'
import { ActivityDetail } from './features/activities/ActivityDetail.jsx'
import { GearCreatePage } from './features/gear/GearCreatePage.jsx'
import { GearEditPage } from './features/gear/GearEditPage.jsx'
import { GearDetail } from './features/gear/GearDetail.jsx'
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

  if (error) return <span className="status-pill error">Backend unreachable: {error}</span>
  if (health) return <span className="status-pill">Backend connected</span>
  return <span className="status-pill">Checking backend…</span>
}

function AuthGate() {
  const [mode, setMode] = useState('login')

  return (
    <AuthLayout>
      {mode === 'login' ? (
        <LoginForm onSwitchToRegister={() => setMode('register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setMode('login')} />
      )}
      <BackendStatus />
    </AuthLayout>
  )
}

function AppContent() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="full-page-center">
        <LoadingState label="Loading Cairn…" />
      </div>
    )
  }

  if (!user) {
    return <AuthGate />
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/outdoors" element={<MyOutdoorsPage />} />
        <Route path="/outdoors/new" element={<ActivityCreatePage />} />
        <Route path="/outdoors/:id/edit" element={<ActivityEditPage />} />
        <Route path="/outdoors/:id" element={<ActivityDetail />} />
        <Route path="/gear" element={<GearPage />} />
        <Route path="/gear/new" element={<GearCreatePage />} />
        <Route path="/gear/:id/edit" element={<GearEditPage />} />
        <Route path="/gear/:id" element={<GearDetail />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
