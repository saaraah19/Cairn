import { useState } from 'react'
import { PhotoLightbox } from '../activities/PhotoLightbox.jsx'
import '../activities/PhotoGallery.css'

// Read-only — no upload/set-cover/remove controls, unlike the private
// PhotoGallery this deliberately mirrors the visual language of. Reuses
// the exact same PhotoLightbox component (and its swipe support) so
// viewing photos feels identical whether the activity is yours or someone
// else's.
export function PublicPhotoGallery({ photos }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (!photos || photos.length === 0) return null

  return (
    <div className="public-photo-gallery">
      <div className="photo-gallery-grid">
        {photos.map((photo, i) => (
          <div key={photo.id} className="photo-tile">
            <img src={photo.secureUrl} alt="" onClick={() => setLightboxIndex(i)} />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && lightboxIndex < photos.length && (
        <PhotoLightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  )
}
