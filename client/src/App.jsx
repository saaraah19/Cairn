import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext.jsx'
import { useAuth } from './features/auth/useAuth.js'
import { ThemeProvider } from './features/theme/ThemeProvider.jsx'
import { useTheme } from './features/theme/useTheme.js'
import { RegisterForm } from './features/auth/RegisterForm.jsx'
import { LoginForm } from './features/auth/LoginForm.jsx'
import { AuthLayout } from './layouts/AuthLayout.jsx'
import { AppShell } from './layouts/AppShell.jsx'
import { LoadingState } from './components/LoadingState.jsx'
import { HomePage } from './pages/HomePage.jsx'
import { MyOutdoorsPage } from './pages/MyOutdoorsPage.jsx'
import { GearPage } from './pages/GearPage.jsx'
import { StatisticsPage } from './pages/StatisticsPage.jsx'
import { ProfileSettingsPage } from './features/profile/ProfileSettingsPage.jsx'
import { ActivityCreatePage } from './features/activities/ActivityCreatePage.jsx'
import { ActivityEditPage } from './features/activities/ActivityEditPage.jsx'
import { ActivityDetail } from './features/activities/ActivityDetail.jsx'
import { GearCreatePage } from './features/gear/GearCreatePage.jsx'
import { GearEditPage } from './features/gear/GearEditPage.jsx'
import { GearDetail } from './features/gear/GearDetail.jsx'
import { PlannedActivityCreatePage } from './features/plannedActivities/PlannedActivityCreatePage.jsx'
import { PlannedActivityEditPage } from './features/plannedActivities/PlannedActivityEditPage.jsx'
import { PlannedActivityDetail } from './features/plannedActivities/PlannedActivityDetail.jsx'
import { PackMyBagPage } from './features/plannedActivities/PackMyBagPage.jsx'
import { DestinationCreatePage } from './features/destinations/DestinationCreatePage.jsx'
import { DestinationEditPage } from './features/destinations/DestinationEditPage.jsx'
import { DestinationDetail } from './features/destinations/DestinationDetail.jsx'
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
  const { setPreference } = useTheme()
  const syncedUserIdRef = useRef(null)

  // Once the authenticated user's saved theme preference is available,
  // apply it (covers the case where it differs from what's cached locally,
  // e.g. changed on another device). Only once per login session, so a
  // change made via Settings later isn't immediately overwritten by this.
  useEffect(() => {
    if (user && syncedUserIdRef.current !== user._id) {
      setPreference(user.preferences?.theme ?? 'system')
      syncedUserIdRef.current = user._id
    }
  }, [user, setPreference])

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
        <Route path="/outdoors/planned/new" element={<PlannedActivityCreatePage />} />
        <Route path="/outdoors/planned/:id/edit" element={<PlannedActivityEditPage />} />
        <Route path="/outdoors/planned/:id/pack" element={<PackMyBagPage />} />
        <Route path="/outdoors/planned/:id" element={<PlannedActivityDetail />} />
        <Route path="/outdoors/destinations/new" element={<DestinationCreatePage />} />
        <Route path="/outdoors/destinations/:id/edit" element={<DestinationEditPage />} />
        <Route path="/outdoors/destinations/:id" element={<DestinationDetail />} />
        <Route path="/outdoors/:id/edit" element={<ActivityEditPage />} />
        <Route path="/outdoors/:id" element={<ActivityDetail />} />
        <Route path="/gear" element={<GearPage />} />
        <Route path="/gear/new" element={<GearCreatePage />} />
        <Route path="/gear/:id/edit" element={<GearEditPage />} />
        <Route path="/gear/:id" element={<GearDetail />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/profile" element={<ProfileSettingsPage />} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
