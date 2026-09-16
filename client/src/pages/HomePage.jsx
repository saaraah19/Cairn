import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth.js'
import { listActivitiesRequest } from '../features/activities/api.js'
import { listPlannedActivitiesRequest } from '../features/plannedActivities/api.js'
import { getStatisticsRequest } from '../features/statistics/api.js'
import { ActivityCard } from '../features/activities/ActivityCard.jsx'
import { PlannedActivityCard } from '../features/plannedActivities/PlannedActivityCard.jsx'
import { LoadingState } from '../components/LoadingState.jsx'
import { EmptyState } from '../components/EmptyState.jsx'
import { formatDistance } from '../features/activities/formatters.js'
import './pages.css'
import './HomePage.css'

// One fetch of a handful of recent activities serves two sections at
// once (Recent activity's cards, and Memory's photo strip pulled from the
// same results' cover photos) — per 03_UX_DESIGN_SPEC.md §9's own warning
// not to let Home become an information dump, this avoids a second,
// heavier fetch just to re-derive photos that are already right there.
const RECENT_ACTIVITIES_FETCH_LIMIT = 6
const RECENT_ACTIVITIES_SHOWN = 3
const UPCOMING_PLANS_SHOWN = 3

export function HomePage() {
  const { user } = useAuth()
  const firstName = user?.name?.split(' ')[0]

  const [recentActivities, setRecentActivities] = useState(null)
  const [upcomingPlans, setUpcomingPlans] = useState(null)
  const [statistics, setStatistics] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      listActivitiesRequest({ limit: RECENT_ACTIVITIES_FETCH_LIMIT, sort: 'newest' }),
      listPlannedActivitiesRequest({ status: 'planned', limit: UPCOMING_PLANS_SHOWN }),
      getStatisticsRequest(),
    ])
      .then(([activitiesData, plansData, statsData]) => {
        if (cancelled) return
        setRecentActivities(activitiesData.activities)
        setUpcomingPlans(plansData.plannedActivities)
        setStatistics(statsData)
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
  }, [])

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h1>Welcome back{firstName ? `, ${firstName}` : ''}</h1>
          <p>Here's your outdoor world, at a glance.</p>
        </div>
        <LoadingState label="Loading your outdoor world…" />
      </div>
    )
  }

  const hasAnyData = error ? false : recentActivities.length > 0 || upcomingPlans.length > 0

  // A brand-new account with nothing logged yet keeps the pure, focused
  // invitation-to-act empty state — the dashboard below only makes sense
  // once there's something to show in it.
  if (!hasAnyData && !error) {
    return (
      <div>
        <div className="page-header">
          <h1>Welcome back{firstName ? `, ${firstName}` : ''}</h1>
          <p>Here's your outdoor world, at a glance.</p>
        </div>
        <EmptyState
          title="Your trail starts here."
          description="Log your first outdoor adventure and it'll show up here — along with what's coming up and how your journey is unfolding."
          action={
            <Link to="/outdoors/new" className="primary-action" style={{ textDecoration: 'none' }}>
              Log an activity
            </Link>
          }
        />
      </div>
    )
  }

  const memoryPhotos = error
    ? []
    : recentActivities.filter((a) => a.coverPhotoId?.secureUrl).map((a) => ({ id: a._id, secureUrl: a.coverPhotoId.secureUrl }))

  const soonestPlan = !error && upcomingPlans.length > 0 ? upcomingPlans[0] : null

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back{firstName ? `, ${firstName}` : ''}</h1>
        <p>Here's your outdoor world, at a glance.</p>
      </div>

      {error && <EmptyState title="Couldn't load your dashboard" description={error} />}

      {!error && (
        <>
          <div className="home-actions">
            <Link to="/outdoors/new" className="home-action-button primary">
              Log an activity
            </Link>
            <Link to="/outdoors/planned/new" className="home-action-button">
              Plan an activity
            </Link>
            <Link
              to={soonestPlan ? `/outdoors/planned/${soonestPlan._id}/pack` : '/outdoors/planned/new'}
              className="home-action-button"
            >
              Prepare my bag
            </Link>
          </div>

          {statistics && statistics.totals.activities > 0 && (
            <div className="home-highlights">
              <div className="home-highlight">
                <span className="home-highlight-value">{statistics.totals.activities}</span>
                <span className="home-highlight-label">
                  {statistics.totals.activities === 1 ? 'adventure' : 'adventures'}
                </span>
              </div>
              {statistics.records.highestAltitudeM != null && (
                <div className="home-highlight">
                  <span className="home-highlight-value">{statistics.records.highestAltitudeM} m</span>
                  <span className="home-highlight-label">highest peak</span>
                </div>
              )}
              {statistics.records.longestDistanceKm != null && (
                <div className="home-highlight">
                  <span className="home-highlight-value">{formatDistance(statistics.records.longestDistanceKm)}</span>
                  <span className="home-highlight-label">longest hike</span>
                </div>
              )}
            </div>
          )}

          {recentActivities.length > 0 && (
            <section className="home-section">
              <div className="home-section-header">
                <h2>Recent activity</h2>
                <Link to="/outdoors">See all</Link>
              </div>
              <div className="home-cards-grid">
                {recentActivities.slice(0, RECENT_ACTIVITIES_SHOWN).map((activity) => (
                  <ActivityCard key={activity._id} activity={activity} />
                ))}
              </div>
            </section>
          )}

          {upcomingPlans.length > 0 && (
            <section className="home-section">
              <div className="home-section-header">
                <h2>Upcoming</h2>
                <Link to="/outdoors">See all</Link>
              </div>
              <div className="home-cards-grid">
                {upcomingPlans.map((plan) => (
                  <PlannedActivityCard key={plan._id} plan={plan} />
                ))}
              </div>
            </section>
          )}

          {memoryPhotos.length > 0 && (
            <section className="home-section">
              <div className="home-section-header">
                <h2>Memories</h2>
              </div>
              <div className="home-memory-strip">
                {memoryPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="home-memory-photo"
                    style={{ backgroundImage: `url(${photo.secureUrl})` }}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
