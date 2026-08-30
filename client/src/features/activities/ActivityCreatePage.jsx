import { ActivityForm } from './ActivityForm.jsx'
import './pageWrapper.css'

export function ActivityCreatePage() {
  return (
    <div>
      <div className="page-header">
        <h1>Log an activity</h1>
        <p>Only name and date are required — fill in as much or as little as you like.</p>
      </div>
      <ActivityForm />
    </div>
  )
}
