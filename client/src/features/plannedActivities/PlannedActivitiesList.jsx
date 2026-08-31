import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listPlannedActivitiesRequest } from './api.js'
import { PlannedActivityCard } from './PlannedActivityCard.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { STATUS_LABELS } from './formatters.js'
import '../activities/ActivitiesList.css'
import '../../pages/pages.css'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

export function PlannedActivitiesList() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [error, setError] = useState(null)
  const [loadedKey, setLoadedKey] = useState(null)

  const requestKey = JSON.stringify({ page, status })
  const isLoading = loadedKey !== requestKey && !error

  useEffect(() => {
    let cancelled = false
    listPlannedActivitiesRequest({ page, status })
      .then((data) => {
        if (cancelled) return
        setItems(data.plannedActivities)
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
  }, [page, status, requestKey])

  return (
    <div>
      <div className="activities-header-row">
        <div className="activities-toolbar">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value)
              setPage(1)
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <Link to="/outdoors/planned/new" className="primary-action" style={{ textDecoration: 'none' }}>
          Plan an activity
        </Link>
      </div>

      {isLoading && <LoadingState label="Loading your plans…" />}

      {!isLoading && error && <EmptyState title="Couldn't load planned activities" description={error} />}

      {!isLoading && !error && items.length === 0 && (
        <EmptyState
          title="Nothing planned yet."
          description="Plan a future adventure ahead of time — you can prepare your backpack and turn it into a real activity once it happens."
          action={
            <Link to="/outdoors/planned/new" className="primary-action" style={{ textDecoration: 'none' }}>
              Plan an activity
            </Link>
          }
        />
      )}

      {!isLoading && !error && items.length > 0 && (
        <>
          <div className="activities-grid">
            {items.map((plan) => (
              <PlannedActivityCard key={plan._id} plan={plan} />
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
