import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createActivityRequest,
  updateActivityRequest,
  listGroupsRequest,
  createGroupRequest,
  listCompanionsRequest,
  createCompanionRequest,
} from './api.js'
import { completePlannedActivityRequest } from '../plannedActivities/api.js'
import { listGearRequest } from '../gear/api.js'
import { listDestinationsRequest } from '../destinations/api.js'
import { CATEGORY_LABELS } from '../gear/formatters.js'
import './ActivityForm.css'
import '../../pages/pages.css'
import '../auth/authForms.css'

const emptyForm = {
  name: '',
  type: 'hiking',
  date: '',
  placeName: '',
  wilaya: '',
  destinationId: '',
  groupName: '',
  companions: '',
  distanceKm: '',
  durationMinutes: '',
  maxAltitudeM: '',
  elevationGainM: '',
  elevationLossM: '',
  difficulty: '',
  weather: '',
  temperatureC: '',
  trailCondition: '',
  costDzd: '',
  rating: '',
  challenges: '',
  notes: '',
  gearItemIds: [],
  visibility: 'private',
}

// Converts an existing activity (nested API shape) into the flat form state.
function activityToForm(activity) {
  return {
    name: activity.name ?? '',
    type: activity.type ?? 'hiking',
    date: activity.date ? activity.date.slice(0, 10) : '',
    placeName: activity.location?.placeName ?? '',
    wilaya: activity.location?.wilaya ?? '',
    destinationId: (typeof activity.destinationId === 'object' ? activity.destinationId?._id : activity.destinationId) ?? '',
    groupName: activity.social?.groupId?.name ?? '',
    companions: (activity.social?.companions ?? []).join(', '),
    distanceKm: activity.trail?.distanceKm ?? '',
    durationMinutes: activity.trail?.durationMinutes ?? '',
    maxAltitudeM: activity.trail?.maxAltitudeM ?? '',
    elevationGainM: activity.trail?.elevationGainM ?? '',
    elevationLossM: activity.trail?.elevationLossM ?? '',
    difficulty: activity.trail?.difficulty ?? '',
    weather: activity.conditions?.weather ?? '',
    temperatureC: activity.conditions?.temperatureC ?? '',
    trailCondition: activity.conditions?.trailCondition ?? '',
    costDzd: activity.costDzd ?? '',
    rating: activity.review?.rating ?? '',
    challenges: activity.review?.challenges ?? '',
    notes: activity.review?.notes ?? '',
    gearItemIds: (activity.gearItemIds ?? []).map((g) => (typeof g === 'string' ? g : g._id)),
    visibility: activity.visibility ?? 'private',
  }
}

const numOrNull = (v) => (v === '' || v === null || v === undefined ? null : Number(v))

export function ActivityForm({ activity, activityId, prefill, plannedActivityId }) {
  const navigate = useNavigate()
  const isEditing = Boolean(activityId)

  const [form, setForm] = useState(
    activity ? activityToForm(activity) : { ...emptyForm, ...prefill }
  )
  const [groups, setGroups] = useState([])
  const [companionSuggestions, setCompanionSuggestions] = useState([])
  const [gearOptions, setGearOptions] = useState([])
  const [destinations, setDestinations] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    listGroupsRequest().then((d) => setGroups(d.groups)).catch(() => {})
    listCompanionsRequest().then((d) => setCompanionSuggestions(d.companions)).catch(() => {})
    listGearRequest({ limit: 50 }).then((d) => setGearOptions(d.gear)).catch(() => {})
    listDestinationsRequest({ limit: 50 }).then((d) => setDestinations(d.destinations)).catch(() => {})
  }, [])

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  function toggleGear(gearId) {
    setForm((f) => ({
      ...f,
      gearItemIds: f.gearItemIds.includes(gearId)
        ? f.gearItemIds.filter((id) => id !== gearId)
        : [...f.gearItemIds, gearId],
    }))
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

    if (!form.name.trim() || !form.date) {
      setError('Name and date are required.')
      return
    }

    setIsSubmitting(true)
    try {
      const groupId = await resolveGroupId()
      const companionNames = form.companions
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const payload = {
        name: form.name.trim(),
        type: form.type,
        date: form.date,
        location: { placeName: form.placeName.trim(), wilaya: form.wilaya.trim() },
        destinationId: form.destinationId || null,
        trail: {
          distanceKm: numOrNull(form.distanceKm),
          durationMinutes: numOrNull(form.durationMinutes),
          maxAltitudeM: numOrNull(form.maxAltitudeM),
          elevationGainM: numOrNull(form.elevationGainM),
          elevationLossM: numOrNull(form.elevationLossM),
          difficulty: form.difficulty || null,
        },
        conditions: {
          weather: form.weather || null,
          temperatureC: numOrNull(form.temperatureC),
          trailCondition: form.trailCondition || null,
        },
        social: { groupId, companions: companionNames },
        costDzd: numOrNull(form.costDzd),
        review: {
          rating: numOrNull(form.rating),
          challenges: form.challenges.trim(),
          notes: form.notes.trim(),
        },
        gearItemIds: form.gearItemIds,
        visibility: form.visibility,
      }

      const result = isEditing
        ? await updateActivityRequest(activityId, payload)
        : await createActivityRequest(payload)

      persistNewCompanions(companionNames) // best-effort, don't block navigation

      if (!isEditing && plannedActivityId) {
        // Links the plan to this new activity and marks it completed. If
        // this fails, the activity itself was still created successfully —
        // don't block navigation on it, just surface the issue.
        await completePlannedActivityRequest(plannedActivityId, result.activity._id).catch((err) => {
          console.error('Failed to link planned activity:', err.message)
        })
      }

      navigate(`/outdoors/${result.activity._id}`)
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
        <h2>Activity</h2>
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
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={form.date} onChange={set('date')} required />
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
            <input
              id="groupName"
              list="groups-list"
              value={form.groupName}
              onChange={set('groupName')}
              placeholder="e.g. JJ"
            />
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
              placeholder="Comma-separated, e.g. Amel, Yasmine"
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
        <h2>Trail</h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="distanceKm">Distance (km)</label>
            <input id="distanceKm" type="number" min="0" step="0.1" value={form.distanceKm} onChange={set('distanceKm')} />
          </div>
          <div className="form-field">
            <label htmlFor="durationMinutes">Duration (min)</label>
            <input id="durationMinutes" type="number" min="0" value={form.durationMinutes} onChange={set('durationMinutes')} />
          </div>
          <div className="form-field">
            <label htmlFor="maxAltitudeM">Max altitude (m)</label>
            <input id="maxAltitudeM" type="number" value={form.maxAltitudeM} onChange={set('maxAltitudeM')} />
          </div>
          <div className="form-field">
            <label htmlFor="elevationGainM">D+ (m)</label>
            <input id="elevationGainM" type="number" min="0" value={form.elevationGainM} onChange={set('elevationGainM')} />
          </div>
          <div className="form-field">
            <label htmlFor="elevationLossM">D- (m)</label>
            <input id="elevationLossM" type="number" min="0" value={form.elevationLossM} onChange={set('elevationLossM')} />
          </div>
          <div className="form-field">
            <label htmlFor="difficulty">Difficulty</label>
            <select id="difficulty" value={form.difficulty} onChange={set('difficulty')}>
              <option value="">—</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="hard">Hard</option>
              <option value="very_hard">Very Hard</option>
            </select>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Conditions</h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="weather">Weather</label>
            <select id="weather" value={form.weather} onChange={set('weather')}>
              <option value="">—</option>
              <option value="sunny">Sunny</option>
              <option value="cloudy">Cloudy</option>
              <option value="rainy">Rainy</option>
              <option value="windy">Windy</option>
              <option value="snowy">Snowy</option>
              <option value="foggy">Foggy</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-field">
            <label htmlFor="temperatureC">Temperature (°C)</label>
            <input id="temperatureC" type="number" value={form.temperatureC} onChange={set('temperatureC')} />
          </div>
          <div className="form-field">
            <label htmlFor="trailCondition">Trail condition</label>
            <select id="trailCondition" value={form.trailCondition} onChange={set('trailCondition')}>
              <option value="">—</option>
              <option value="dry">Dry</option>
              <option value="muddy">Muddy</option>
              <option value="wet">Wet</option>
              <option value="snowy">Snowy</option>
              <option value="rocky">Rocky</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Gear</h2>
        {gearOptions.length === 0 ? (
          <p style={{ color: 'var(--color-mist)', fontSize: '0.85rem' }}>
            No gear in your closet yet — add some from Gear to select it here.
          </p>
        ) : (
          <div className="gear-checkbox-grid">
            {gearOptions.map((g) => (
              <label key={g._id} className="gear-checkbox">
                <input
                  type="checkbox"
                  checked={form.gearItemIds.includes(g._id)}
                  onChange={() => toggleGear(g._id)}
                />
                <span>{g.name}</span>
                <span className="gear-checkbox-category">{CATEGORY_LABELS[g.category]}</span>
              </label>
            ))}
          </div>
        )}
      </section>

      <section className="form-section">
        <h2>Review</h2>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="costDzd">Cost (DZD)</label>
            <input id="costDzd" type="number" min="0" value={form.costDzd} onChange={set('costDzd')} />
          </div>
          <div className="form-field">
            <label htmlFor="rating">Rating (0–10)</label>
            <input id="rating" type="number" min="0" max="10" value={form.rating} onChange={set('rating')} />
          </div>
          <div className="form-field span-2">
            <label htmlFor="challenges">Challenges</label>
            <textarea id="challenges" value={form.challenges} onChange={set('challenges')} />
          </div>
          <div className="form-field span-2">
            <label htmlFor="notes">Notes</label>
            <textarea id="notes" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
      </section>

      <section className="form-section">
        <h2>Visibility</h2>
        <div className="visibility-toggle">
          <label>
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={form.visibility === 'private'}
              onChange={set('visibility')}
            />
            Private
          </label>
          <label>
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={form.visibility === 'public'}
              onChange={set('visibility')}
            />
            Public
          </label>
        </div>
      </section>

      <div className="form-actions">
        <button className="primary-action" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Log activity'}
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
