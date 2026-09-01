import { StatisticsView } from '../features/statistics/StatisticsView.jsx'
import './pages.css'

export function StatisticsPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Statistics</h1>
        <p>The story of your outdoor life, in numbers.</p>
      </div>
      <StatisticsView />
    </div>
  )
}
