import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'
import { EmptyState } from '../components/EmptyState.jsx'
import './pages.css'

export function HomePage() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0]

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back{firstName ? `, ${firstName}` : ''}</h1>
        <p>Here's your outdoor world, at a glance.</p>
      </div>

      <EmptyState
        title="Your trail starts here."
        description="Log your first outdoor adventure and it'll show up here — along with what's coming up and how your journey is unfolding."
        action={
          <Link to="/outdoors/new" className="primary-action" style={{ textDecoration: 'none' }}>
            Log an activity
          </Link>
        }
      />
    </div>
  )
}
