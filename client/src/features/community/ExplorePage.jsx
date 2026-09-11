import { useEffect, useState } from 'react'
import { getFeedRequest } from './api.js'
import { PublicActivityCard } from './PublicActivityCard.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import './ExplorePage.css'
import '../activities/ActivitiesList.css'
import '../../pages/pages.css'

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'trekking', label: 'Trekking' },
  { value: 'camping', label: 'Camping' },
]

export function ExplorePage() {
  const [type, setType] = useState('')
  const [wilaya, setWilaya] = useState('')
  const [activities, setActivities] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const requestKey = JSON.stringify({ type, wilaya })

  // Chronological only — no ranking/recommendation logic, matching
  // docs/08_COMMUNITY_PROPOSAL.md §6's explicit rejection of algorithmic
  // feeds. Filter changes reset the list rather than appending to it.
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    getFeedRequest({ scope: 'explore', type, wilaya })
      .then((data) => {
        if (cancelled) return
        setActivities(data.activities)
        setNextCursor(data.nextCursor)
        setError(null)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey])

  function loadMore() {
    if (!nextCursor) return
    setIsLoadingMore(true)
    getFeedRequest({ scope: 'explore', type, wilaya, cursor: nextCursor })
      .then((data) => {
        setActivities((prev) => [...prev, ...data.activities])
        setNextCursor(data.nextCursor)
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoadingMore(false))
  }

  return (
    <div>
      <div className="page-header">
        <h1>Explore</h1>
        <p>Public adventures shared by hikers across Cairn.</p>
      </div>

      <div className="activities-toolbar">
        <select aria-label="Filter by type" value={type} onChange={(e) => setType(e.target.value)}>
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <input
          type="search"
          placeholder="Filter by wilaya…"
          aria-label="Filter by wilaya"
          value={wilaya}
          onChange={(e) => setWilaya(e.target.value)}
        />
      </div>

      {isLoading && <LoadingState label="Loading the feed…" />}

      {!isLoading && error && <EmptyState title="Couldn't load the feed" description={error} />}

      {!isLoading && !error && activities.length === 0 && (
        <EmptyState
          title="Nothing here yet."
          description="No public activities match these filters right now — try a different type or wilaya, or check back later."
        />
      )}

      {!isLoading && !error && activities.length > 0 && (
        <>
          <div className="activities-grid">
            {activities.map((activity) => (
              <PublicActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          {nextCursor && (
            <div className="explore-load-more">
              <button onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
