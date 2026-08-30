import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listActivitiesRequest } from './api.js'
import { ActivityCard } from './ActivityCard.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import './ActivitiesList.css'
import '../../pages/pages.css'

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'hiking', label: 'Hiking' },
  { value: 'trekking', label: 'Trekking' },
  { value: 'camping', label: 'Camping' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'distance', label: 'Distance' },
  { value: 'rating', label: 'Rating' },
  { value: 'elevation', label: 'Elevation' },
]

export function ActivitiesList() {
  const [activities, setActivities] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState('newest')
  const [error, setError] = useState(null)
  const [loadedKey, setLoadedKey] = useState(null)

  const requestKey = JSON.stringify({ page, search, type, sort })
  const isLoading = loadedKey !== requestKey && !error

  useEffect(() => {
    let cancelled = false

    listActivitiesRequest({ page, search, type, sort })
      .then((data) => {
        if (cancelled) return
        setActivities(data.activities)
        setPagination(data.pagination)
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
  }, [page, search, type, sort, requestKey])

  // Reset to page 1 whenever a filter changes.
  function handleFilterChange(setter) {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  return (
    <div>
      <div className="activities-header-row">
        <div className="activities-toolbar">
          <input
            type="search"
            placeholder="Search activities…"
            value={search}
            onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
          />
          <select value={type} onChange={(e) => handleFilterChange(setType)(e.target.value)}>
            {TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <Link to="/outdoors/new" className="primary-action" style={{ textDecoration: 'none' }}>
          Log an activity
        </Link>
      </div>

      {isLoading && <LoadingState label="Loading your activities…" />}

      {!isLoading && error && (
        <EmptyState title="Couldn't load activities" description={error} />
      )}

      {!isLoading && !error && activities.length === 0 && (
        <EmptyState
          title="Your trail starts here."
          description="Log your first outdoor adventure and it'll show up here."
          action={
            <Link to="/outdoors/new" className="primary-action" style={{ textDecoration: 'none' }}>
              Log an activity
            </Link>
          }
        />
      )}

      {!isLoading && !error && activities.length > 0 && (
        <>
          <div className="activities-grid">
            {activities.map((activity) => (
              <ActivityCard key={activity._id} activity={activity} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="activities-pagination">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
