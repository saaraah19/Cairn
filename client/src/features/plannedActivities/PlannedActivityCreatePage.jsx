import { PlannedActivityForm } from './PlannedActivityForm.jsx'
import '../activities/pageWrapper.css'

export function PlannedActivityCreatePage() {
  return (
    <div>
      <div className="page-header">
        <h1>Plan an activity</h1>
        <p>Name and a planned date are all that's required.</p>
      </div>
      <PlannedActivityForm />
    </div>
  )
}
