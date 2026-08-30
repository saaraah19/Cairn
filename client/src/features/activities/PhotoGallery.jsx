import { useEffect, useState } from 'react'
import {
  listPhotosRequest,
  uploadPhotoRequest,
  setCoverPhotoRequest,
  deletePhotoRequest,
} from './api.js'
import './PhotoGallery.css'

export function PhotoGallery({ activityId, onCoverChange }) {
  const [photos, setPhotos] = useState([])
  const [error, setError] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [busyPhotoId, setBusyPhotoId] = useState(null)

  useEffect(() => {
    let cancelled = false
    listPhotosRequest(activityId)
      .then((data) => {
        if (!cancelled) setPhotos(data.photos)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [activityId])

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // allow selecting the same file again later
    if (!file) return

    setError(null)
    setIsUploading(true)
    try {
      const data = await uploadPhotoRequest(activityId, file)
      setPhotos((prev) => {
        const next = data.photo.isCover ? prev.map((p) => ({ ...p, isCover: false })) : prev
        return [...next, data.photo]
      })
      if (data.photo.isCover) onCoverChange?.(data.photo)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleSetCover(photoId) {
    setBusyPhotoId(photoId)
    setError(null)
    try {
      const data = await setCoverPhotoRequest(activityId, photoId)
      setPhotos((prev) => prev.map((p) => ({ ...p, isCover: p._id === photoId })))
      onCoverChange?.(data.photo)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyPhotoId(null)
    }
  }

  async function handleDelete(photoId) {
    setBusyPhotoId(photoId)
    setError(null)
    const deletedPhoto = photos.find((p) => p._id === photoId)
    try {
      await deletePhotoRequest(photoId)
      setPhotos((prev) => {
        const remaining = prev.filter((p) => p._id !== photoId)
        // Mirrors the backend: if the deleted photo was the cover, the
        // oldest remaining photo (list is sorted isCover desc, createdAt asc,
        // so index 0 among non-cover-deleted remainder) becomes the new cover.
        if (deletedPhoto?.isCover && remaining.length > 0) {
          remaining[0] = { ...remaining[0], isCover: true }
          onCoverChange?.(remaining[0])
        } else if (deletedPhoto?.isCover) {
          onCoverChange?.(null)
        }
        return remaining
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyPhotoId(null)
    }
  }

  return (
    <div>
      <div className="photo-gallery-grid">
        {photos.map((photo) => (
          <div key={photo._id} className="photo-tile">
            <img src={photo.secureUrl} alt="" />
            {photo.isCover && <span className="photo-tile-cover-badge">Cover</span>}
            <div className="photo-tile-actions">
              {!photo.isCover && (
                <button
                  type="button"
                  onClick={() => handleSetCover(photo._id)}
                  disabled={busyPhotoId === photo._id}
                >
                  Set cover
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDelete(photo._id)}
                disabled={busyPhotoId === photo._id}
              >
                Remove
              </button>
            </div>
          </div>
        ))}

        <label className="photo-upload-label">
          {isUploading ? 'Uploading…' : '+ Add photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
        </label>
      </div>

      {error && <p className="photo-gallery-error">{error}</p>}
    </div>
  )
}
