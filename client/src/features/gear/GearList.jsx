import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listGearRequest, listGearStoresRequest } from './api.js'
import { GearCard } from './GearCard.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { CATEGORY_LABELS, formatPrice } from './formatters.js'
import '../activities/ActivitiesList.css'
import '../../pages/pages.css'
import './GearList.css'

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
]

export function GearList() {
  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [store, setStore] = useState('')
  const [stores, setStores] = useState([])
  const [error, setError] = useState(null)
  const [loadedKey, setLoadedKey] = useState(null)

  const requestKey = JSON.stringify({ page, search, category, store })
  const isLoading = loadedKey !== requestKey && !error

  useEffect(() => {
    let cancelled = false
    listGearRequest({ page, search, category, store })
      .then((data) => {
        if (cancelled) return
        setItems(data.gear)
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
  }, [page, search, category, store, requestKey])

  // Fetched once — the store dropdown's own options don't change based on
  // whichever store is currently selected, and re-fetching it on every
  // filter change would be pointless (product-owner request, 2026-09-14 —
  // see 07_POST_V1_ROADMAP.md §C: "know where I buy my gear and how much
  // I've spent at each store").
  useEffect(() => {
    listGearStoresRequest()
      .then((data) => setStores(data.stores))
      .catch(() => {})
  }, [])

  function handleFilterChange(setter) {
    return (value) => {
      setter(value)
      setPage(1)
    }
  }

  const selectedStoreSummary = store ? stores.find((s) => s.store.toLowerCase() === store.toLowerCase()) : null

  return (
    <div>
      <div className="activities-header-row">
        <div className="activities-toolbar">
          <input
            type="search"
            placeholder="Search gear…"
            aria-label="Search gear"
            value={search}
            onChange={(e) => handleFilterChange(setSearch)(e.target.value)}
          />
          <select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => handleFilterChange(setCategory)(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {stores.length > 0 && (
            <select aria-label="Filter by store" value={store} onChange={(e) => handleFilterChange(setStore)(e.target.value)}>
              <option value="">All stores</option>
              {stores.map((s) => (
                <option key={s.store} value={s.store}>
                  {s.store}
                </option>
              ))}
            </select>
          )}
        </div>
        <Link to="/gear/new" className="primary-action" style={{ textDecoration: 'none' }}>
          Add gear
        </Link>
      </div>

      {selectedStoreSummary && (
        <p className="gear-store-summary">
          <strong>{selectedStoreSummary.store}</strong> — {selectedStoreSummary.itemCount}{' '}
          {selectedStoreSummary.itemCount === 1 ? 'item' : 'items'} — {formatPrice(selectedStoreSummary.totalSpentDzd)} spent
        </p>
      )}

      {isLoading && <LoadingState label="Loading your gear…" />}

      {!isLoading && error && <EmptyState title="Couldn't load gear" description={error} />}

      {!isLoading && !error && items.length === 0 && (
        <EmptyState
          title="Your closet is empty."
          description="Add the gear you own and Cairn will track where you've used it, automatically."
          action={
            <Link to="/gear/new" className="primary-action" style={{ textDecoration: 'none' }}>
              Add gear
            </Link>
          }
        />
      )}

      {!isLoading && !error && items.length > 0 && (
        <>
          <div className="activities-grid">
            {items.map((gear) => (
              <GearCard key={gear._id} gear={gear} />
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
