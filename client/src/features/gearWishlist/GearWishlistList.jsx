import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listWishlistItemsRequest } from './api.js'
import { GearWishlistItemCard } from './GearWishlistItemCard.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import '../activities/ActivitiesList.css'
import '../../pages/pages.css'

export function GearWishlistList() {
  const [items, setItems] = useState([])
  // Default view: only what's still wanted, matching this section's own
  // name ("Gear I Need to Buy") — already-purchased items move out of
  // the way rather than cluttering the active wishlist, same idea as
  // completed planned activities not dominating the "planned" view.
  const [showPurchased, setShowPurchased] = useState(false)
  const [error, setError] = useState(null)
  const [loadedKey, setLoadedKey] = useState(null)

  const requestKey = JSON.stringify({ showPurchased })
  const isLoading = loadedKey !== requestKey && !error

  useEffect(() => {
    let cancelled = false
    listWishlistItemsRequest(showPurchased ? {} : { isPurchased: false })
      .then((data) => {
        if (cancelled) return
        setItems(data.wishlistItems)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(requestKey)
      })
    return () => {
      cancelled = true
    }
  }, [showPurchased, requestKey])

  return (
    <div>
      <div className="activities-header-row">
        <label className="wishlist-show-purchased">
          <input type="checkbox" checked={showPurchased} onChange={(e) => setShowPurchased(e.target.checked)} />
          Show purchased items too
        </label>
        <Link to="/gear/wishlist/new" className="primary-action" style={{ textDecoration: 'none' }}>
          Add to wishlist
        </Link>
      </div>

      {isLoading && <LoadingState label="Loading your wishlist…" />}

      {error && <EmptyState title="Couldn't load your wishlist" description={error} />}

      {!isLoading && !error && items.length === 0 && (
        <EmptyState
          title="Nothing on your list yet."
          description="Keep track of gear you're planning to buy, and compare a few options before you commit."
          action={
            <Link to="/gear/wishlist/new" className="primary-action" style={{ textDecoration: 'none' }}>
              Add to wishlist
            </Link>
          }
        />
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="activities-grid">
          {items.map((item) => (
            <GearWishlistItemCard key={item._id} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
