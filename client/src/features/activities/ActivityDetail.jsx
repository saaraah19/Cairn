import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getActivityRequest, deleteActivityRequest } from './api.js'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import {
  formatDate,
  formatDuration,
  formatDistance,
  TYPE_LABELS,
  DIFFICULTY_LABELS,
  WEATHER_LABELS,
  TRAIL_CONDITION_LABELS,
} from './formatters.js'
import './ActivityDetail.css'

export function ActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [activity, setActivity] = useState(null)
  const [error, setError] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isLoading = loadedId !== id && !error

  useEffect(() => {
    let cancelled = false
    getActivityRequest(id)
      .then((data) => {
        if (!cancelled) {
          setActivity(data.activity)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadedId(id)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteActivityRequest(id)
      navigate('/outdoors')
    } catch (err) {
      setError(err.message)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (isLoading) return <LoadingState label="Loading activity…" />
  if (error) return <EmptyState title="Couldn't load this activity" description={error} />
  if (!activity) return null

  const trail = activity.trail ?? {}
  const conditions = activity.conditions ?? {}
  const review = activity.review ?? {}
  const social = activity.social ?? {}

  const stats = [
    { label: 'Distance', value: formatDistance(trail.distanceKm) },
    { label: 'Duration', value: formatDuration(trail.durationMinutes) },
    { label: 'D+', value: trail.elevationGainM != null ? `${trail.elevationGainM} m` : null },
    { label: 'D-', value: trail.elevationLossM != null ? `${trail.elevationLossM} m` : null },
    { label: 'Max alt.', value: trail.maxAltitudeM != null ? `${trail.maxAltitudeM} m` : null },
    { label: 'Difficulty', value: trail.difficulty ? DIFFICULTY_LABELS[trail.difficulty] : null },
  ].filter((s) => s.value)

  return (
    <div>
      <div className="activity-detail-hero" />

      <div className="activity-detail-title-row">
        <div>
          <h1>
            #{activity.activityNumber} {activity.name}
          </h1>
          <p className="activity-detail-meta">
            {TYPE_LABELS[activity.type]} · {formatDate(activity.date)}
            {activity.location?.placeName ? ` · ${activity.location.placeName}` : ''}
            {activity.location?.wilaya ? `, ${activity.location.wilaya}` : ''}
          </p>
        </div>
        <div className="activity-detail-actions">
          <Link to={`/outdoors/${id}/edit`} className="icon-button">
            Edit
          </Link>
          <button className="icon-button danger" onClick={() => setShowConfirm(true)}>
            Delete
          </button>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="activity-detail-stats">
          {stats.map((s) => (
            <div key={s.label} className="stat-tile">
              <span className="stat-tile-value">{s.value}</span>
              <span className="stat-tile-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {(conditions.weather || conditions.temperatureC != null || conditions.trailCondition) && (
        <div className="detail-section">
          <h2>Conditions</h2>
          <div className="detail-kv">
            {conditions.weather && (
              <div>
                <span>Weather</span>
                <span>{WEATHER_LABELS[conditions.weather]}</span>
              </div>
            )}
            {conditions.temperatureC != null && (
              <div>
                <span>Temperature</span>
                <span>{conditions.temperatureC}°C</span>
              </div>
            )}
            {conditions.trailCondition && (
              <div>
                <span>Trail</span>
                <span>{TRAIL_CONDITION_LABELS[conditions.trailCondition]}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {(social.groupId?.name || social.companions?.length > 0) && (
        <div className="detail-section">
          <h2>Who I went with</h2>
          <div className="detail-kv">
            {social.groupId?.name && (
              <div>
                <span>Group</span>
                <span>{social.groupId.name}</span>
              </div>
            )}
            {social.companions?.length > 0 && (
              <div>
                <span>Companions</span>
                <span>{social.companions.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activity.costDzd != null && (
        <div className="detail-section">
          <h2>Cost</h2>
          <p>{activity.costDzd} DZD</p>
        </div>
      )}

      {review.rating != null && (
        <div className="detail-section">
          <h2>Rating</h2>
          <p>{review.rating} / 10</p>
        </div>
      )}

      {review.challenges && (
        <div className="detail-section">
          <h2>Challenges</h2>
          <p>{review.challenges}</p>
        </div>
      )}

      {review.notes && (
        <div className="detail-section">
          <h2>Notes</h2>
          <p>{review.notes}</p>
        </div>
      )}

      {showConfirm && (
        <div className="confirm-dialog-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <h3>Delete "{activity.name}"?</h3>
            <p>This permanently removes Activity #{activity.activityNumber}. This can't be undone.</p>
            <div className="confirm-dialog-actions">
              <button className="icon-button" onClick={() => setShowConfirm(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="icon-button danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
