import './states.css'

// Empty states are an invitation to act, not an apology — see the UX spec
// (§40): "Your trail starts here," not "No records found."
export function EmptyState({ title, description, action }) {
  return (
    <div className="state-block empty-state">
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}
