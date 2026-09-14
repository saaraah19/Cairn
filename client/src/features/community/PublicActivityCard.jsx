import { Link } from 'react-router-dom'
import { formatDate, formatDuration, formatDistance, formatElevation, TYPE_LABELS, DIFFICULTY_LABELS } from '../activities/formatters.js'
import '../activities/ActivityCard.css'
import './PublicActivityCard.css'

// Card is a <div>, not a single <Link>, because the author byline needs
// its own separate link to the author's profile — nesting an <a> inside
// an <a> is invalid HTML and breaks React Router. The main clickable
// region (photo + body) is wrapped in its own inner Link instead.
export function PublicActivityCard({ activity }) {
  const stats = [
    formatDistance(activity.trail?.distanceKm),
    formatDuration(activity.trail?.durationMinutes),
    activity.trail?.difficulty ? DIFFICULTY_LABELS[activity.trail.difficulty] : null,
  ].filter(Boolean)

  return (
    <div className="activity-card">
      <Link to={`/community/activities/${activity.id}`} className="activity-card-link">
        <div
          className="activity-card-photo-placeholder"
          style={
            activity.coverPhoto?.secureUrl
              ? {
                  backgroundImage: `url(${activity.coverPhoto.secureUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {activity.trail?.elevationGainM != null && (
            <span className="activity-card-elevation">{formatElevation(activity.trail.elevationGainM)}</span>
          )}
        </div>

        <div className="activity-card-body">
          <div className="activity-card-heading">
            <h3>{activity.name}</h3>
          </div>

          <p className="activity-card-meta">
            {TYPE_LABELS[activity.type]} · {formatDate(activity.date)}
            {activity.location?.placeName ? ` · ${activity.location.placeName}` : ''}
          </p>

          {stats.length > 0 && <p className="activity-card-stats">{stats.join(' · ')}</p>}

          {(activity.kudosCount > 0 || activity.commentsCount > 0) && (
            <p className="activity-card-social-counts">
              {activity.kudosCount > 0 && <span>▲ {activity.kudosCount}</span>}
              {activity.commentsCount > 0 && <span>💬 {activity.commentsCount}</span>}
            </p>
          )}
        </div>
      </Link>

      {activity.author?.username ? (
        <Link to={`/community/users/${activity.author.username}`} className="activity-card-author">
          by {activity.author.name}
        </Link>
      ) : (
        activity.author?.name && <span className="activity-card-author unlinked">by {activity.author.name}</span>
      )}
    </div>
  )
}
