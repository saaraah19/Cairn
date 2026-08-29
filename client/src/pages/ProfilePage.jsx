import { useAuth } from '../features/auth/useAuth.js'
import './pages.css'
import './ProfilePage.css'

export function ProfilePage() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div>
      <div className="page-header">
        <h1>Profile</h1>
        <p>Username, bio, and account settings will be editable here (Phase 9).</p>
      </div>

      <div className="profile-card">
        <div className="profile-row">
          <span className="profile-row-label">Name</span>
          <span>{user.name}</span>
        </div>
        <div className="profile-row">
          <span className="profile-row-label">Username</span>
          <span>@{user.username}</span>
        </div>
        <div className="profile-row">
          <span className="profile-row-label">Email</span>
          <span>{user.email}</span>
        </div>
        <div className="profile-row">
          <span className="profile-row-label">Signed in with</span>
          <span className="profile-providers">
            {user.authProviders?.map((p) => (
              <span key={p} className="provider-pill">
                {p}
              </span>
            ))}
          </span>
        </div>

        <button className="logout-button" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  )
}
