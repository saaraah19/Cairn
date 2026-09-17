import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getWishlistItemRequest } from './api.js'
import { GearWishlistItemForm } from './GearWishlistItemForm.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'

export function GearWishlistEditPage() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getWishlistItemRequest(id)
      .then((data) => {
        if (!cancelled) setItem(data.wishlistItem)
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

  if (isLoading) return <LoadingState label="Loading wishlist item…" />
  if (error) return <EmptyState title="Couldn't load this item" description={error} />

  return <GearWishlistItemForm item={item} />
}
