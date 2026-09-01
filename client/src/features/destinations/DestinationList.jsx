import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDestinationsRequest } from './api.js'
import { DestinationCard } from './DestinationCard.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { STATUS_LABELS } from './formatters.js'
import '../activities/ActivitiesList.css'
import '../../pages/pages.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

export function DestinationList() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)
  const [loadedKey, setLoadedKey] = useState(null)

  const requestKey = JSON.stringify({ page, search, status })
  const isLoading = loadedKey !== requestKey && !error

  useEffect(() => {
    let cancelled = false
    listDestinationsRequest({ page, search, status })
      .then((data) => {
        if (cancelled) return
        setItems(data.destinations)
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
  }, [page, search, status, requestKey])

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
            placeholder="Search destinations…"
            value={search}
            onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
          />
          <select value={status} onChange={(e) => handleFilterChange(setStatus)(e.target.value)}>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <Link to="/outdoors/destinations/new" className="primary-action" style={{ textDecoration: 'none' }}>
          Add destination
        </Link>
      </div>

      {isLoading && <LoadingState label="Loading your destinations…" />}

      {!isLoading && error && <EmptyState title="Couldn't load destinations" description={error} />}

      {!isLoading && !error && items.length === 0 && (
        <EmptyState
          title="Nowhere saved yet."
          description="Save places you want to remember, explore, or eventually visit — no plan required."
          action={
            <Link to="/outdoors/destinations/new" className="primary-action" style={{ textDecoration: 'none' }}>
              Add destination
            </Link>
          }
        />
      )}

      {!isLoading && !error && items.length > 0 && (
        <>
          <div className="activities-grid">
            {items.map((destination) => (
              <DestinationCard key={destination._id} destination={destination} />
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
              <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
