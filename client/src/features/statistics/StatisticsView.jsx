import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStatisticsRequest } from './api.js'
import { BreakdownBarList } from './BreakdownBarList.jsx'
import { CountIcon, DistanceIcon, DurationIcon, ElevationIcon } from './StatsIcons.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { formatDistance, formatDuration, TYPE_LABELS, DIFFICULTY_LABELS } from '../activities/formatters.js'
import './StatisticsView.css'

// Difficulty bars go from calm green to warm clay/red as difficulty rises —
// color here carries meaning (escalating effort), not just decoration.
const DIFFICULTY_COLORS = {
  easy: 'var(--color-moss-light)',
  moderate: 'var(--color-moss)',
  hard: 'var(--color-clay)',
  very_hard: 'var(--color-danger)',
}

const TYPE_COLORS = {
  hiking: 'var(--color-moss)',
  trekking: 'var(--color-clay)',
  camping: 'var(--color-moss-deep)',
}

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
    { label: 'Activities', value: totals.activities, icon: CountIcon, color: 'var(--color-moss)' },
    { label: 'Distance', value: formatDistance(totals.distanceKm) ?? '0 km', icon: DistanceIcon, color: 'var(--color-clay)' },
    { label: 'Duration', value: formatDuration(totals.durationMinutes) ?? '0m', icon: DurationIcon, color: 'var(--color-moss-light)' },
    { label: 'Elevation gain', value: `+${totals.elevationGainM} m`, icon: ElevationIcon, color: 'var(--color-clay-light)' },
  ]

  const recordCards = [
    records.highestAltitudeM != null && {
      label: 'Highest Peak',
      value: `${records.highestAltitudeM} m`,
      activity: records.highestAltitudeActivity,
      color: 'var(--color-moss)',
    },
    records.longestDistanceKm != null && {
      label: 'Longest Adventure',
      value: formatDistance(records.longestDistanceKm),
      activity: records.longestDistanceActivity,
      color: 'var(--color-clay)',
    },
    records.hardestDifficulty && {
      label: 'Hardest Adventure',
      value: DIFFICULTY_LABELS[records.hardestDifficulty],
      activity: records.hardestActivity,
      color: DIFFICULTY_COLORS[records.hardestDifficulty],
    },
    records.highestRating != null && {
      label: 'Highest-Rated',
      value: `${records.highestRating} / 10`,
      activity: records.highestRatedActivity,
      color: 'var(--color-clay-light)',
    },
  ].filter(Boolean)

  return (
    <div>
      <div className="stats-highlights">
        {highlights.map((h) => (
          <div key={h.label} className="stats-highlight-tile">
            <span className="stats-highlight-icon" style={{ background: h.color }}>
              <h.icon />
            </span>
            <span>
              <span className="stats-highlight-value">{h.value}</span>
              <span className="stats-highlight-label">{h.label}</span>
            </span>
          </div>
        ))}
      </div>

      {recordCards.length > 0 && (
        <div className="stats-records">
          {recordCards.map((r) => (
            <div key={r.label} className="stats-record-card" style={{ '--accent-color': r.color }}>
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
            <BreakdownBarList
              items={breakdowns.byType}
              labelKey="type"
              formatLabel={(v) => TYPE_LABELS[v]}
              getColor={(v) => TYPE_COLORS[v]}
            />
          </div>
        )}
        {breakdowns.byDifficulty.length > 0 && (
          <div className="stats-breakdown-card">
            <h3>By difficulty</h3>
            <BreakdownBarList
              items={breakdowns.byDifficulty}
              labelKey="difficulty"
              formatLabel={(v) => DIFFICULTY_LABELS[v]}
              getColor={(v) => DIFFICULTY_COLORS[v]}
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
