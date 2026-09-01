import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createDestinationRequest, updateDestinationRequest } from './api.js'
import '../activities/ActivityForm.css'
import '../auth/authForms.css'
import '../../pages/pages.css'

const emptyForm = {
  name: '',
  placeName: '',
  wilaya: '',
  country: '',
  status: 'wishlist',
  targetDate: '',
  description: '',
  notes: '',
  links: '',
}

function destinationToForm(d) {
  return {
    name: d.name ?? '',
    placeName: d.location?.placeName ?? '',
    wilaya: d.location?.wilaya ?? '',
    country: d.location?.country ?? '',
    status: d.status ?? 'wishlist',
    targetDate: d.targetDate ? d.targetDate.slice(0, 10) : '',
    description: d.description ?? '',
    notes: d.notes ?? '',
    links: (d.links ?? []).join('\n'),
  }
}

export function DestinationForm({ destination, destinationId }) {
  const navigate = useNavigate()
  const isEditing = Boolean(destinationId)
  const [form, setForm] = useState(destination ? destinationToForm(destination) : emptyForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        location: {
          placeName: form.placeName.trim(),
          wilaya: form.wilaya.trim(),
          country: form.country.trim(),
        },
        status: form.status,
        targetDate: form.targetDate || null,
        description: form.description.trim(),
        notes: form.notes.trim(),
        links: form.links.split('\n').map((s) => s.trim()).filter(Boolean),
      }

      const result = isEditing
        ? await updateDestinationRequest(destinationId, payload)
        : await createDestinationRequest(payload)

      navigate(`/outdoors/destinations/${result.destination._id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      {error && <div className="auth-form-error">{error}</div>}

      <section className="form-section">
        <h2>Destination</h2>
        <div className="form-grid">
          <div className="form-field span-2">
            <label htmlFor="name">Name</label>
            <input id="name" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-field">
            <label htmlFor="placeName">Place</label>
            <input id="placeName" value={form.placeName} onChange={set('placeName')} />
          </div>
          <div className="form-field">
            <label htmlFor="wilaya">Wilaya</label>
            <input id="wilaya" value={form.wilaya} onChange={set('wilaya')} />
          </div>
          <div className="form-field">
            <label htmlFor="country">Country</label>
            <input id="country" value={form.country} onChange={set('country')} />
          </div>
          <div className="form-field">
            <label htmlFor="status">Status</label>
            <select id="status" value={form.status} onChange={set('status')}>
              <option value="wishlist">Wishlist</option>
              <option value="planned">Planned</option>
              <option value="visited">Visited</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="targetDate">Target date</label>
            <input id="targetDate" type="date" value={form.targetDate} onChange={set('targetDate')} />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Details</h2>
        <div className="form-grid">
          <div className="form-field span-2">
            <label htmlFor="description">Description</label>
            <textarea id="description" value={form.description} onChange={set('description')} />
          </div>
          <div className="form-field span-2">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" value={form.notes} onChange={set('notes')} />
          </div>
          <div className="form-field span-2">
            <label htmlFor="links">Links (one per line)</label>
            <textarea id="links" value={form.links} onChange={set('links')} placeholder="https://…" />
          </div>
        </div>
      </section>

      <div className="form-actions">
        <button className="primary-action" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Save destination'}
        </button>
        <button type="button" className="secondary-action" onClick={() => navigate(-1)} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
