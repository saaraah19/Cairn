import { Link } from 'react-router-dom'
import { formatDate, formatDuration, formatDistance, formatElevation, TYPE_LABELS, DIFFICULTY_LABELS } from './formatters.js'
import './ActivityCard.css'

export function ActivityCard({ activity }) {
  const stats = [
    formatDistance(activity.trail?.distanceKm),
    formatDuration(activity.trail?.durationMinutes),
    activity.trail?.difficulty ? DIFFICULTY_LABELS[activity.trail.difficulty] : null,
  ].filter(Boolean)

  return (
    <Link to={`/outdoors/${activity._id}`} className="activity-card">
      <div className="activity-card-photo-placeholder">
        {activity.trail?.elevationGainM != null && (
          <span className="activity-card-elevation">
            {formatElevation(activity.trail.elevationGainM)}
          </span>
        )}
      </div>

      <div className="activity-card-body">
        <div className="activity-card-heading">
          <span className="activity-card-number">#{activity.activityNumber}</span>
          <h3>{activity.name}</h3>
        </div>

        <p className="activity-card-meta">
          {TYPE_LABELS[activity.type]} · {formatDate(activity.date)}
          {activity.location?.placeName ? ` · ${activity.location.placeName}` : ''}
        </p>

        {stats.length > 0 && (
          <p className="activity-card-stats">{stats.join(' · ')}</p>
        )}
      </div>
    </Link>
  )
}
