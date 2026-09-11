import { Link } from 'react-router-dom'
import { formatDate, formatDuration, formatDistance, formatElevation, TYPE_LABELS, DIFFICULTY_LABELS } from '../activities/formatters.js'
import '../activities/ActivityCard.css'

// Deliberately reuses ActivityCard.css rather than duplicating the visual
// language — Community should feel like an extension of Cairn, not a
// separate app (docs/08_COMMUNITY_PROPOSAL.md §9). No activity number
// (never public, see §2) and no author attribution yet: the feed DTO
// doesn't currently carry the author's username, and a public activity's
// author doesn't necessarily have a public profile to link to (the two are
// deliberately decoupled, §4) — worth revisiting once that's a common
// combination, not required for this milestone's definition of done.
export function PublicActivityCard({ activity }) {
  const stats = [
    formatDistance(activity.trail?.distanceKm),
    formatDuration(activity.trail?.durationMinutes),
    activity.trail?.difficulty ? DIFFICULTY_LABELS[activity.trail.difficulty] : null,
  ].filter(Boolean)

  return (
    <Link to={`/community/activities/${activity.id}`} className="activity-card">
      <div className="activity-card-photo-placeholder">
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
      </div>
    </Link>
  )
}
