import { Wordmark } from '../components/Logo.jsx'
import './AuthLayout.css'

export function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout-card">
        <div className="auth-layout-brand">
          <Wordmark />
        </div>
        <p className="auth-layout-tagline">
          Plan your adventure. Prepare for it. Live it. Record it. Remember it.
        </p>
        {children}
      </div>
    </div>
  )
}
