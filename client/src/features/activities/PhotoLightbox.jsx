import { useEffect, useCallback, useRef } from 'react'
import './PhotoLightbox.css'

// Swipe threshold in pixels — deliberately generous so an incidental small
// finger movement while tapping to close doesn't get misread as a swipe.
const SWIPE_THRESHOLD = 50

export function PhotoLightbox({ photos, index, onClose, onNavigate }) {
  const photo = photos[index]
  const touchStartX = useRef(null)

  const goPrev = useCallback(() => {
    onNavigate((index - 1 + photos.length) % photos.length)
  }, [index, photos.length, onNavigate])

  const goNext = useCallback(() => {
    onNavigate((index + 1) % photos.length)
  }, [index, photos.length, onNavigate])

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && photos.length > 1) goPrev()
      if (e.key === 'ArrowRight' && photos.length > 1) goNext()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, goPrev, goNext, photos.length])

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    if (touchStartX.current == null || photos.length <= 1) return
    const delta = e.changedTouches[0].clientX - touchStartX.current
    if (delta > SWIPE_THRESHOLD) goPrev()
    else if (delta < -SWIPE_THRESHOLD) goNext()
    touchStartX.current = null
  }

  if (!photo) return null

  return (
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={onClose}
    >
      <button className="lightbox-close" onClick={onClose} aria-label="Close">
        ×
      </button>

      {photos.length > 1 && (
        <button
          className="lightbox-nav prev"
          onClick={(e) => {
            e.stopPropagation()
            goPrev()
          }}
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}

      <div
        className="lightbox-image-wrap"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img src={photo.secureUrl} alt="" />
      </div>

      {photos.length > 1 && (
        <button
          className="lightbox-nav next"
          onClick={(e) => {
            e.stopPropagation()
            goNext()
          }}
          aria-label="Next photo"
        >
          ›
        </button>
      )}

      {photos.length > 1 && (
        <span className="lightbox-counter">
          {index + 1} / {photos.length}
        </span>
      )}
    </div>
  )
}
