import { Link, Outlet } from 'react-router-dom'
import { Wordmark } from '../components/Logo.jsx'
import './PublicPageLayout.css'

export function PublicPageLayout() {
  return (
    <div className="public-page-layout">
      <header className="public-page-nav">
        <Link to="/" className="public-page-brand">
          <Wordmark />
        </Link>
        <nav className="public-page-nav-actions">
          <Link to="/login" className="public-page-link">
            Log in
          </Link>
          <Link to="/register" className="public-page-btn">
            Sign up
          </Link>
        </nav>
      </header>
      <main className="public-page-content">
        <Outlet />
      </main>
    </div>
  )
}
