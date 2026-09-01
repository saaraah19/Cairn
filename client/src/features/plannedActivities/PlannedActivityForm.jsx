import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createPlannedActivityRequest, updatePlannedActivityRequest } from './api.js'
import { listGroupsRequest, createGroupRequest, listCompanionsRequest, createCompanionRequest } from '../activities/api.js'
import { listDestinationsRequest } from '../destinations/api.js'
import '../activities/ActivityForm.css'
import '../../pages/pages.css'
import '../auth/authForms.css'

const emptyForm = {
  name: '',
  type: 'hiking',
  plannedDate: '',
  placeName: '',
  wilaya: '',
  destinationId: '',
  groupName: '',
  companions: '',
  estimatedCostDzd: '',
  expectedDifficulty: '',
  notes: '',
  status: 'planned',
}

function planToForm(plan) {
  return {
    name: plan.name ?? '',
    type: plan.type ?? 'hiking',
    plannedDate: plan.plannedDate ? plan.plannedDate.slice(0, 10) : '',
    placeName: plan.location?.placeName ?? '',
    wilaya: plan.location?.wilaya ?? '',
    destinationId: (typeof plan.destinationId === 'object' ? plan.destinationId?._id : plan.destinationId) ?? '',
    groupName: plan.social?.groupId?.name ?? '',
    companions: (plan.social?.companions ?? []).join(', '),
    estimatedCostDzd: plan.estimatedCostDzd ?? '',
    expectedDifficulty: plan.expectedDifficulty ?? '',
    notes: plan.notes ?? '',
    status: plan.status ?? 'planned',
  }
}

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

export function PlannedActivityForm({ plan, planId }) {
  const navigate = useNavigate()
  const isEditing = Boolean(planId)
  const [form, setForm] = useState(plan ? planToForm(plan) : emptyForm)
  const [groups, setGroups] = useState([])
  const [companionSuggestions, setCompanionSuggestions] = useState([])
  const [destinations, setDestinations] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    listGroupsRequest().then((d) => setGroups(d.groups)).catch(() => {})
    listCompanionsRequest().then((d) => setCompanionSuggestions(d.companions)).catch(() => {})
    listDestinationsRequest({ limit: 50 }).then((d) => setDestinations(d.destinations)).catch(() => {})
  }, [])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function resolveGroupId() {
    const name = form.groupName.trim()
    if (!name) return null
    const existing = groups.find((g) => g.name.toLowerCase() === name.toLowerCase())
    if (existing) return existing._id
    const created = await createGroupRequest(name)
    return created.group._id
  }

  async function persistNewCompanions(names) {
    const existingNames = new Set(companionSuggestions.map((c) => c.name.toLowerCase()))
    const newOnes = names.filter((n) => n && !existingNames.has(n.toLowerCase()))
    await Promise.all(newOnes.map((n) => createCompanionRequest(n).catch(() => null)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!form.name.trim() || !form.plannedDate) {
      setError('Name and planned date are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const groupId = await resolveGroupId()
      const companionNames = form.companions.split(',').map((s) => s.trim()).filter(Boolean)

      const payload = {
        name: form.name.trim(),
        type: form.type,
        plannedDate: form.plannedDate,
        location: { placeName: form.placeName.trim(), wilaya: form.wilaya.trim() },
        destinationId: form.destinationId || null,
        social: { groupId, companions: companionNames },
        estimatedCostDzd: numOrNull(form.estimatedCostDzd),
        expectedDifficulty: form.expectedDifficulty || null,
        notes: form.notes.trim(),
        status: form.status,
      }

      const result = isEditing
        ? await updatePlannedActivityRequest(planId, payload)
        : await createPlannedActivityRequest(payload)

      persistNewCompanions(companionNames)

      navigate(`/outdoors/planned/${result.plannedActivity._id}`)
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
        <h2>Plan</h2>
        <div className="form-grid">
          <div className="form-field span-2">
            <label htmlFor="name">Name</label>
            <input id="name" value={form.name} onChange={set('name')} required />
          </div>
          <div className="form-field">
            <label htmlFor="type">Type</label>
            <select id="type" value={form.type} onChange={set('type')}>
              <option value="hiking">Hiking</option>
              <option value="trekking">Trekking</option>
              <option value="camping">Camping</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="plannedDate">Planned date</label>
            <input id="plannedDate" type="date" value={form.plannedDate} onChange={set('plannedDate')} required />
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
            <label htmlFor="destinationId">Saved destination</label>
            <select id="destinationId" value={form.destinationId} onChange={set('destinationId')}>
              <option value="">None</option>
              {destinations.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="groupName">Group</label>
            <input id="groupName" list="groups-list" value={form.groupName} onChange={set('groupName')} />
            <datalist id="groups-list">
              {groups.map((g) => (
                <option key={g._id} value={g.name} />
              ))}
            </datalist>
          </div>
          <div className="form-field span-2">
            <label htmlFor="companions">Companions</label>
            <input
              id="companions"
              list="companions-list"
              value={form.companions}
              onChange={set('companions')}
              placeholder="Comma-separated"
            />
            <datalist id="companions-list">
              {companionSuggestions.map((c) => (
                <option key={c._id} value={c.name} />
              ))}
            </datalist>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Expectations</h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="estimatedCostDzd">Estimated cost (DZD)</label>
            <input
              id="estimatedCostDzd"
              type="number"
              min="0"
              value={form.estimatedCostDzd}
              onChange={set('estimatedCostDzd')}
            />
          </div>
          <div className="form-field">
            <label htmlFor="expectedDifficulty">Expected difficulty</label>
            <select id="expectedDifficulty" value={form.expectedDifficulty} onChange={set('expectedDifficulty')}>
              <option value="">—</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
              <option value="very_hard">Very Hard</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="status">Status</label>
            <select id="status" value={form.status} onChange={set('status')}>
              <option value="planned">Planned</option>
              <option value="ready">Ready</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="form-field span-2">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
      </section>

      <div className="form-actions">
        <button className="primary-action" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Save plan'}
        </button>
        <button type="button" className="secondary-action" onClick={() => navigate(-1)} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
