import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStatisticsRequest } from './api.js'
import { BreakdownBarList } from './BreakdownBarList.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { formatDistance, formatDuration, TYPE_LABELS, DIFFICULTY_LABELS } from '../activities/formatters.js'
import '../activities/ActivityDetail.css'
import './StatisticsView.css'

export function StatisticsView() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getStatisticsRequest()
      .then((data) => {
        if (!cancelled) setStats(data)
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

  if (isLoading) return <LoadingState label="Adding up your journey…" />
  if (error) return <EmptyState title="Couldn't load statistics" description={error} />
  if (!stats || stats.totals.activities === 0) {
    return (
      <EmptyState
        title="Nothing to show yet."
        description="Once you've logged a few activities, your distance, elevation, and personal records will appear here."
        action={
          <Link to="/outdoors/new" className="primary-action" style={{ textDecoration: 'none' }}>
            Log an activity
          </Link>
        }
      />
    )
  }

  const { totals, records, breakdowns } = stats

  const highlights = [
    { label: 'Activities', value: totals.activities },
    { label: 'Distance', value: formatDistance(totals.distanceKm) ?? '0 km' },
    { label: 'Duration', value: formatDuration(totals.durationMinutes) ?? '0m' },
    { label: 'Elevation gain', value: `+${totals.elevationGainM} m` },
  ]

  const recordCards = [
    records.highestAltitudeM != null && {
      label: 'Highest Peak',
      value: `${records.highestAltitudeM} m`,
      activity: records.highestAltitudeActivity,
    },
    records.longestDistanceKm != null && {
      label: 'Longest Adventure',
      value: formatDistance(records.longestDistanceKm),
      activity: records.longestDistanceActivity,
    },
    records.hardestDifficulty && {
      label: 'Hardest Adventure',
      value: DIFFICULTY_LABELS[records.hardestDifficulty],
      activity: records.hardestActivity,
    },
    records.highestRating != null && {
      label: 'Highest-Rated',
      value: `${records.highestRating} / 10`,
      activity: records.highestRatedActivity,
    },
  ].filter(Boolean)

  return (
    <div>
      <div className="stats-highlights">
        {highlights.map((h) => (
          <div key={h.label} className="stat-tile">
            <span className="stat-tile-value">{h.value}</span>
            <span className="stat-tile-label">{h.label}</span>
          </div>
        ))}
      </div>

      {recordCards.length > 0 && (
        <div className="stats-records">
          {recordCards.map((r) => (
            <div key={r.label} className="stats-record-card">
              <div className="stats-record-label">{r.label}</div>
              <span className="stats-record-value">{r.value}</span>
              {r.activity && (
                <Link to={`/outdoors/${r.activity._id}`}>
                  #{r.activity.activityNumber} {r.activity.name}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="stats-breakdowns">
        {breakdowns.byType.length > 0 && (
          <div className="stats-breakdown-card">
            <h3>By type</h3>
            <BreakdownBarList items={breakdowns.byType} labelKey="type" formatLabel={(v) => TYPE_LABELS[v]} />
          </div>
        )}
        {breakdowns.byDifficulty.length > 0 && (
          <div className="stats-breakdown-card">
            <h3>By difficulty</h3>
            <BreakdownBarList
              items={breakdowns.byDifficulty}
              labelKey="difficulty"
              formatLabel={(v) => DIFFICULTY_LABELS[v]}
            />
          </div>
        )}
        {breakdowns.byYear.length > 0 && (
          <div className="stats-breakdown-card">
            <h3>By year</h3>
            <BreakdownBarList items={breakdowns.byYear} labelKey="year" />
          </div>
        )}
        {breakdowns.byWilaya.length > 0 && (
          <div className="stats-breakdown-card">
            <h3>By wilaya</h3>
            <BreakdownBarList items={breakdowns.byWilaya} labelKey="wilaya" />
          </div>
        )}
      </div>
    </div>
  )
}
