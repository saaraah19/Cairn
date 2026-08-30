import { GearForm } from './GearForm.jsx'
import '../activities/pageWrapper.css'

export function GearCreatePage() {
  return (
    <div>
      <div className="page-header">
        <h1>Add gear</h1>
        <p>Only the name is required — add as much detail as you like.</p>
      </div>
      <GearForm />
    </div>
  )
}
