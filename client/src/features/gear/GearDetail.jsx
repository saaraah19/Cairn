import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getGearRequest,
  deleteGearRequest,
  getGearUsageRequest,
  uploadGearPhotoRequest,
  removeGearPhotoRequest,
} from './api.js'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { formatWeight, formatPrice, formatPurchaseDate, CATEGORY_LABELS, CONDITION_LABELS } from './formatters.js'
import { formatDate, TYPE_LABELS } from '../activities/formatters.js'
import '../activities/ActivityDetail.css'
import './GearDetail.css'

export function GearDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [gear, setGear] = useState(null)
  const [usage, setUsage] = useState([])
  const [error, setError] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)

  const isLoading = loadedId !== id && !error

  useEffect(() => {
    let cancelled = false
    Promise.all([getGearRequest(id), getGearUsageRequest(id)])
      .then(([gearData, usageData]) => {
        if (cancelled) return
        setGear(gearData.gear)
        setUsage(usageData.activities)
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
      const data = await uploadGearPhotoRequest(id, file)
      setGear(data.gear)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  async function handleRemovePhoto() {
    setIsUploadingPhoto(true)
    try {
      const data = await removeGearPhotoRequest(id)
      setGear(data.gear)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deleteGearRequest(id)
      navigate('/gear')
    } catch (err) {
      setError(err.message)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  if (isLoading) return <LoadingState label="Loading gear…" />
  if (error && !gear) return <EmptyState title="Couldn't load this item" description={error} />
  if (!gear) return null

  return (
    <div>
      <div
        className="gear-detail-photo"
        style={gear.photo?.secureUrl ? { backgroundImage: `url(${gear.photo.secureUrl})` } : undefined}
      >
        {!gear.photo?.secureUrl && (isUploadingPhoto ? 'Uploading…' : 'No photo yet')}
        <label className="gear-photo-upload-label">
          {gear.photo?.secureUrl ? 'Replace photo' : 'Add photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoSelect}
            disabled={isUploadingPhoto}
          />
        </label>
      </div>

      {gear.photo?.secureUrl && (
        <button className="icon-button danger" onClick={handleRemovePhoto} disabled={isUploadingPhoto}>
          Remove photo
        </button>
      )}

      <div className="activity-detail-title-row">
        <div>
          <h1>{gear.name}</h1>
          <p className="activity-detail-meta">
            {CATEGORY_LABELS[gear.category]}
            {gear.brand ? ` · ${gear.brand}` : ''}
            {gear.model ? ` ${gear.model}` : ''}
          </p>
        </div>
        <div className="activity-detail-actions">
          <Link to={`/gear/${id}/edit`} className="icon-button">
            Edit
          </Link>
          <button className="icon-button danger" onClick={() => setShowConfirm(true)}>
            Delete
          </button>
        </div>
      </div>

      <div className="detail-kv" style={{ marginBottom: 'var(--space-lg)' }}>
        {gear.quantity > 1 && (
          <div>
            <span>Quantity</span>
            <span>{gear.quantity}</span>
          </div>
        )}
        {formatWeight(gear.weightGrams) && (
          <div>
            <span>Weight</span>
            <span>{formatWeight(gear.weightGrams)}</span>
          </div>
        )}
        {gear.condition && (
          <div>
            <span>Condition</span>
            <span>{CONDITION_LABELS[gear.condition]}</span>
          </div>
        )}
        {formatPurchaseDate(gear.purchaseDate) && (
          <div>
            <span>Purchased</span>
            <span>{formatPurchaseDate(gear.purchaseDate)}</span>
          </div>
        )}
        {formatPrice(gear.purchasePriceDzd) && (
          <div>
            <span>Price</span>
            <span>{formatPrice(gear.purchasePriceDzd)}</span>
          </div>
        )}
        {gear.store && (
          <div>
            <span>Store</span>
            <span>{gear.store}</span>
          </div>
        )}
      </div>

      {gear.productUrl && (
        <div className="detail-section">
          <h2>Product link</h2>
          <p>
            <a href={gear.productUrl} target="_blank" rel="noreferrer">
              {gear.productUrl}
            </a>
          </p>
        </div>
      )}

      {gear.notes && (
        <div className="detail-section">
          <h2>Notes</h2>
          <p>{gear.notes}</p>
        </div>
      )}

      <div className="detail-section">
        <h2>
          Usage history{usage.length > 0 && <span className="usage-count"> · used {usage.length} time{usage.length === 1 ? '' : 's'}</span>}
        </h2>
        {usage.length === 0 ? (
          <p style={{ color: 'var(--color-mist)', fontSize: '0.9rem' }}>
            Not used on any activity yet.
          </p>
        ) : (
          <ul className="usage-list">
            {usage.map((activity) => (
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
          </ul>
        )}
      </div>

      {showConfirm && (
        <div className="confirm-dialog-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <h3>Delete "{gear.name}"?</h3>
            <p>This permanently removes it from your gear closet. This can't be undone.</p>
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
