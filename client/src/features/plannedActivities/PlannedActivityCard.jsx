import { Link } from 'react-router-dom'
import { formatDate, TYPE_LABELS } from '../activities/formatters.js'
import { STATUS_LABELS, STATUS_COLORS } from './formatters.js'
import './PlannedActivityCard.css'

export function PlannedActivityCard({ plan }) {
  return (
    <Link to={`/outdoors/planned/${plan._id}`} className="planned-card">
      <div className="planned-card-top">
        <h3>{plan.name}</h3>
        <span
          className="planned-status-badge"
          style={{ background: STATUS_COLORS[plan.status] }}
        >
          {STATUS_LABELS[plan.status]}
        </span>
      </div>
      <p className="planned-card-meta">
        {TYPE_LABELS[plan.type]} · {formatDate(plan.plannedDate)}
        {plan.location?.placeName ? ` · ${plan.location.placeName}` : ''}
      </p>
    </Link>
  )
}
