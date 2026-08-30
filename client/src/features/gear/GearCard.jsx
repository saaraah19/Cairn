import { Link } from 'react-router-dom'
import { formatWeight, CATEGORY_LABELS } from './formatters.js'
import './GearCard.css'

export function GearCard({ gear }) {
  const weight = formatWeight(gear.weightGrams)

  return (
    <Link to={`/gear/${gear._id}`} className="gear-card">
      <div
        className="gear-card-photo"
        style={
          gear.photo?.secureUrl
            ? { backgroundImage: `url(${gear.photo.secureUrl})` }
            : undefined
        }
      >
        {!gear.photo?.secureUrl && 'No photo'}
      </div>
      <div className="gear-card-body">
        <div className="gear-card-category">{CATEGORY_LABELS[gear.category]}</div>
        <h3>{gear.name}</h3>
        <p className="gear-card-meta">
          {[gear.brand, weight].filter(Boolean).join(' · ')}
        </p>
      </div>
    </Link>
  )
}
