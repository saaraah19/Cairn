import { useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { AuthProvider } from './features/auth/AuthContext.jsx'
import { useAuth } from './features/auth/useAuth.js'
import { ThemeProvider } from './features/theme/ThemeProvider.jsx'
import { useTheme } from './features/theme/useTheme.js'
import { RegisterForm } from './features/auth/RegisterForm.jsx'
import { LoginForm } from './features/auth/LoginForm.jsx'
import { AuthLayout } from './layouts/AuthLayout.jsx'
import { AppShell } from './layouts/AppShell.jsx'
import { LoadingState } from './components/LoadingState.jsx'
import { LandingPage } from './pages/LandingPage.jsx'
import { PublicPageLayout } from './layouts/PublicPageLayout.jsx'
import { PublicActivityDetail } from './features/community/PublicActivityDetail.jsx'
import { PublicProfile } from './features/community/PublicProfile.jsx'
import { ExplorePage } from './features/community/ExplorePage.jsx'
import { NotificationsPage } from './features/notifications/NotificationsPage.jsx'
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

function AuthGate({ mode }) {
  const navigate = useNavigate()

  return (
    <AuthLayout>
      {mode === 'login' ? (
        <LoginForm onSwitchToRegister={() => navigate('/register')} />
      ) : (
        <RegisterForm onSwitchToLogin={() => navigate('/login')} />
      )}
      <BackendStatus />
    </AuthLayout>
  )
}

// Redirects to "/" — used as a catch-all in both route trees below. In the
// signed-out tree this lands on the landing page; in the signed-in tree it
// lands on Home. Needed in *both* trees because a successful login/register
// flips which tree is active without changing the URL — without this, a
// user who submits the login form while sitting on "/login" would be left
// on a URL the newly-active (signed-in) route tree has no match for.
function RedirectHome() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/', { replace: true })
  }, [navigate])

  return null
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
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthGate mode="login" />} />
        <Route path="/register" element={<AuthGate mode="register" />} />
        <Route element={<PublicPageLayout />}>
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/community/activities/:id" element={<PublicActivityDetail />} />
          <Route path="/community/users/:username" element={<PublicProfile />} />
        </Route>
        <Route path="*" element={<RedirectHome />} />
      </Routes>
    )
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
        <Route path="/community/activities/:id" element={<PublicActivityDetail />} />
        <Route path="/community/users/:username" element={<PublicProfile />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      <Route path="*" element={<RedirectHome />} />
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
