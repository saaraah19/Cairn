import { EmptyState } from '../components/EmptyState.jsx'
import './pages.css'

export function GearPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Gear</h1>
        <p>Your personal outdoor closet.</p>
      </div>

      <EmptyState
        title="Your closet is empty."
        description="Add the gear you own and Cairn will track where you've used it, automatically."
        action={
          <button className="primary-action" disabled title="Coming in Phase 4">
            Add gear
          </button>
        }
      />
    </div>
  )
}
