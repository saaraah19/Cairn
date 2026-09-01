import { Link } from 'react-router-dom'
import { STATUS_LABELS, STATUS_COLORS } from './formatters.js'
import '../plannedActivities/PlannedActivityCard.css'
import './DestinationCard.css'

export function DestinationCard({ destination }) {
  return (
    <Link to={`/outdoors/destinations/${destination._id}`} className="destination-card">
      <div
        className="destination-card-cover"
        style={
          destination.coverImage?.secureUrl
            ? { backgroundImage: `url(${destination.coverImage.secureUrl})` }
            : undefined
        }
      >
        <span
          className="planned-status-badge"
          style={{ background: STATUS_COLORS[destination.status] }}
        >
          {STATUS_LABELS[destination.status]}
        </span>
      </div>
      <div className="destination-card-body">
        <h3>{destination.name}</h3>
        <p className="destination-card-meta">
          {[destination.location?.placeName, destination.location?.wilaya].filter(Boolean).join(', ')}
        </p>
      </div>
    </Link>
  )
}
