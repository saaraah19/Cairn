import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getDestinationRequest,
  deleteDestinationRequest,
  getDestinationRelatedRequest,
  uploadDestinationCoverRequest,
  removeDestinationCoverRequest,
} from './api.js'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { formatDate, TYPE_LABELS } from '../activities/formatters.js'
import { STATUS_LABELS as PLAN_STATUS_LABELS } from '../plannedActivities/formatters.js'
import { STATUS_LABELS, STATUS_COLORS } from './formatters.js'
import '../activities/ActivityDetail.css'
import '../gear/GearDetail.css'

export function DestinationDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [destination, setDestination] = useState(null)
  const [related, setRelated] = useState({ activities: [], plannedActivities: [] })
  const [error, setError] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  const isLoading = loadedId !== id && !error

  useEffect(() => {
    let cancelled = false
    Promise.all([getDestinationRequest(id), getDestinationRelatedRequest(id)])
      .then(([destData, relatedData]) => {
        if (cancelled) return
        setDestination(destData.destination)
        setRelated(relatedData)
        setError(null)
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

  async function handlePhotoSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setIsUploadingPhoto(true)
    try {
      const data = await uploadDestinationCoverRequest(id, file)
      setDestination(data.destination)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  async function handleRemovePhoto() {
    setIsUploadingPhoto(true)
    try {
      const data = await removeDestinationCoverRequest(id)
      setDestination(data.destination)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteDestinationRequest(id)
      navigate('/outdoors')
    } catch (err) {
      setError(err.message)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (isLoading) return <LoadingState label="Loading destination…" />
  if (error && !destination) return <EmptyState title="Couldn't load this destination" description={error} />
  if (!destination) return null

  const hasRelated = related.activities.length > 0 || related.plannedActivities.length > 0

  return (
    <div>
      <div
        className="gear-detail-photo"
        style={
          destination.coverImage?.secureUrl
            ? { backgroundImage: `url(${destination.coverImage.secureUrl})` }
            : undefined
        }
      >
        {!destination.coverImage?.secureUrl && (isUploadingPhoto ? 'Uploading…' : 'No cover image yet')}
        <label className="gear-photo-upload-label">
          {destination.coverImage?.secureUrl ? 'Replace image' : 'Add cover image'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelect}
            disabled={isUploadingPhoto}
          />
        </label>
      </div>

      {destination.coverImage?.secureUrl && (
        <button className="icon-button danger" onClick={handleRemovePhoto} disabled={isUploadingPhoto}>
          Remove image
        </button>
      )}

      <div className="activity-detail-title-row">
        <div>
          <h1>{destination.name}</h1>
          <p className="activity-detail-meta">
            {[destination.location?.placeName, destination.location?.wilaya, destination.location?.country]
              .filter(Boolean)
              .join(', ')}
          </p>
          <span className="planned-status-badge" style={{ background: STATUS_COLORS[destination.status] }}>
            {STATUS_LABELS[destination.status]}
          </span>
        </div>
        <div className="activity-detail-actions">
          <Link to={`/outdoors/destinations/${id}/edit`} className="icon-button">
            Edit
          </Link>
          <button className="icon-button danger" onClick={() => setShowConfirm(true)}>
            Delete
          </button>
        </div>
      </div>

      {destination.targetDate && (
        <div className="detail-kv" style={{ marginBottom: 'var(--space-lg)' }}>
          <div>
            <span>Target date</span>
            <span>{formatDate(destination.targetDate)}</span>
          </div>
        </div>
      )}

      {destination.description && (
        <div className="detail-section">
          <h2>Description</h2>
          <p>{destination.description}</p>
        </div>
      )}

      {destination.notes && (
        <div className="detail-section">
          <h2>Notes</h2>
          <p>{destination.notes}</p>
        </div>
      )}

      {destination.links?.length > 0 && (
        <div className="detail-section">
          <h2>Links</h2>
          {destination.links.map((link) => (
            <p key={link}>
              <a href={link} target="_blank" rel="noreferrer">
                {link}
              </a>
            </p>
          ))}
        </div>
      )}

      <div className="detail-section">
        <h2>Related activities & plans</h2>
        {!hasRelated ? (
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem' }}>
            Nothing linked to this destination yet.
          </p>
        ) : (
          <ul className="usage-list">
            {related.activities.map((activity) => (
              <li key={activity._id}>
                <Link to={`/outdoors/${activity._id}`}>
                  <span>
                    #{activity.activityNumber} {activity.name}
                  </span>
                  <span className="usage-count">
                    {TYPE_LABELS[activity.type]} · {formatDate(activity.date)}
                  </span>
                </Link>
              </li>
            ))}
            {related.plannedActivities.map((plan) => (
              <li key={plan._id}>
                <Link to={`/outdoors/planned/${plan._id}`}>
                  <span>{plan.name}</span>
                  <span className="usage-count">
                    {PLAN_STATUS_LABELS[plan.status]} · {formatDate(plan.plannedDate)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showConfirm && (
        <div className="confirm-dialog-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <h3>Delete "{destination.name}"?</h3>
            <p>
              This permanently removes the destination. Activities and plans that reference it keep
              their own records — this can't be undone.
            </p>
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
