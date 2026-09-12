import { useState } from 'react'
import './ReportButton.css'

// A small self-contained "Report" action: no admin/review UI exists
// anywhere in the app (per docs/08_COMMUNITY_PROPOSAL.md §16, reports are
// reviewed manually/out-of-band), so this component's only job is to file
// the report and give the reporter honest feedback that it was received.
const REASON_OPTIONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'other', label: 'Other' },
]

export function ReportButton({ onSubmit, label = 'Report' }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reason, setReason] = useState('spam')
  const [details, setDetails] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [isDone, setIsDone] = useState(false)

  if (isDone) {
    return <span className="report-button-done">Reported — thanks for letting us know.</span>
  }

  if (!isOpen) {
    return (
      <button type="button" className="report-button-trigger" onClick={() => setIsOpen(true)}>
        {label}
      </button>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      await onSubmit(reason, details.trim() || undefined)
      setIsDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="report-button-form" onSubmit={handleSubmit}>
      <select value={reason} onChange={(e) => setReason(e.target.value)} disabled={isSubmitting}>
        {REASON_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        placeholder="Optional details…"
        maxLength={500}
        rows={2}
        disabled={isSubmitting}
      />
      {error && <p className="report-button-error">{error}</p>}
      <div className="report-button-actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Sending…' : 'Submit report'}
        </button>
        <button
          type="button"
          className="report-button-cancel"
          onClick={() => setIsOpen(false)}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
