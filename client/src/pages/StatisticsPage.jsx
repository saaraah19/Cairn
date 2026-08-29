import { EmptyState } from '../components/EmptyState.jsx'
import './pages.css'

export function StatisticsPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Statistics</h1>
        <p>The story of your outdoor life, in numbers.</p>
      </div>

      <EmptyState
        title="Nothing to show yet."
        description="Once you've logged a few activities, your distance, elevation, and personal records will appear here."
      />
    </div>
  )
}
