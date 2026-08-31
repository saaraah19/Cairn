import { useLocation } from 'react-router-dom'
import { ActivityForm } from './ActivityForm.jsx'
import './pageWrapper.css'

export function ActivityCreatePage() {
  const location = useLocation()
  const { prefill, plannedActivityId } = location.state ?? {}

  return (
    <div>
      <div className="page-header">
        <h1>{plannedActivityId ? 'Log this activity' : 'Log an activity'}</h1>
        <p>
          {plannedActivityId
            ? "We've filled in what you planned — change anything that turned out differently."
            : 'Only name and date are required — fill in as much or as little as you like.'}
        </p>
      </div>
      <ActivityForm prefill={prefill} plannedActivityId={plannedActivityId} />
    </div>
  )
}
