import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPlannedActivityRequest, updatePlannedActivityRequest } from './api.js'
import { listGearRequest } from '../gear/api.js'
import { formatWeight, CATEGORY_LABELS } from '../gear/formatters.js'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import '../../pages/pages.css'
import '../auth/authForms.css'
import '../activities/ActivityForm.css'
import './PackMyBag.css'

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
]

export function PackMyBagPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [planName, setPlanName] = useState('')
  const [gearOptions, setGearOptions] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([getPlannedActivityRequest(id), listGearRequest({ limit: 50 })])
      .then(([planData, gearData]) => {
        if (cancelled) return
        setPlanName(planData.plannedActivity.name)
        setSelectedIds((planData.plannedActivity.packedGearItemIds ?? []).map((g) => g._id))
        setGearOptions(gearData.gear)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  const filteredOptions = useMemo(() => {
    return gearOptions.filter((g) => {
      if (category && g.category !== category) return false
      if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [gearOptions, search, category])

  const totalWeightGrams = useMemo(() => {
    return gearOptions
      .filter((g) => selectedIds.includes(g._id))
      .reduce((sum, g) => sum + (g.weightGrams ?? 0), 0)
  }, [gearOptions, selectedIds])

  function toggle(gearId) {
    setSelectedIds((prev) =>
      prev.includes(gearId) ? prev.filter((id) => id !== gearId) : [...prev, gearId]
    )
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    try {
      // The frontend total above is for instant feedback only — the backend
      // re-validates every gear ID belongs to this user when saving
      // (docs/05_DATA_MODEL_AND_API_CONTRACT.md §64).
      await updatePlannedActivityRequest(id, { packedGearItemIds: selectedIds })
      navigate(`/outdoors/planned/${id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return <LoadingState label="Loading your gear…" />
  if (error && gearOptions.length === 0) {
    return <EmptyState title="Couldn't load gear" description={error} />
  }

  return (
    <div>
      <div className="page-header">
        <h1>Pack My Bag</h1>
        <p>For {planName}</p>
      </div>

      <div className="pack-summary-bar">
        <span className="pack-summary-bar-count">
          {selectedIds.length} item{selectedIds.length === 1 ? '' : 's'} packed
        </span>
        <span className="pack-summary-bar-weight">{formatWeight(totalWeightGrams) ?? '0 g'}</span>
      </div>

      {error && <div className="auth-form-error">{error}</div>}

      <div className="pack-toolbar">
        <input
          type="search"
          placeholder="Search your gear…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {gearOptions.length === 0 ? (
        <EmptyState
          title="Your closet is empty."
          description="Add some gear first, then come back here to pack your bag."
        />
      ) : (
        <div className="pack-item-grid">
          {filteredOptions.map((g) => (
            <label key={g._id} className="pack-item">
              <input
                type="checkbox"
                checked={selectedIds.includes(g._id)}
                onChange={() => toggle(g._id)}
              />
              <div
                className="pack-item-thumb"
                style={g.photo?.secureUrl ? { backgroundImage: `url(${g.photo.secureUrl})` } : undefined}
              />
              <div className="pack-item-info">
                <span className="pack-item-name">{g.name}</span>
                <span className="pack-item-weight">{formatWeight(g.weightGrams) ?? '—'}</span>
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="form-actions">
        <button className="primary-action" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save packed bag'}
        </button>
        <button
          type="button"
          className="secondary-action"
          onClick={() => navigate(`/outdoors/planned/${id}`)}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
