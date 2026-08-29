import './states.css'

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div className="state-block" role="status" aria-live="polite">
      <span className="loading-dot" />
      <span>{label}</span>
    </div>
  )
}
