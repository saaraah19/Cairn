import { EmptyState } from '../components/EmptyState.jsx'
import './pages.css'

export function MyOutdoorsPage() {
  return (
    <div>
      <div className="page-header">
        <h1>My Outdoors</h1>
        <p>Activities, planned adventures, and destinations — your personal workspace.</p>
      </div>

      <EmptyState
        title="Nothing recorded yet."
        description="Activities, planned activities, and destinations will all live here once you start using Cairn."
      />
    </div>
  )
}
