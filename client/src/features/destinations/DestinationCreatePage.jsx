import { DestinationForm } from './DestinationForm.jsx'
import '../activities/pageWrapper.css'

export function DestinationCreatePage() {
  return (
    <div>
      <div className="page-header">
        <h1>Add a destination</h1>
        <p>Somewhere you want to remember, explore, or eventually visit — no plan required.</p>
      </div>
      <DestinationForm />
    </div>
  )
}
