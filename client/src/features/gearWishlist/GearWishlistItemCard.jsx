import { Link } from 'react-router-dom'
import { CATEGORY_LABELS, formatPrice } from '../gear/formatters.js'
import './GearWishlist.css'

export function GearWishlistItemCard({ item }) {
  return (
    <Link to={`/gear/wishlist/${item._id}`} className="wishlist-card">
      <div className="wishlist-card-top">
        <h3>{item.name}</h3>
        {item.isPurchased && <span className="wishlist-purchased-badge">Purchased</span>}
      </div>
      <p className="wishlist-card-meta">
        {CATEGORY_LABELS[item.category]}
        {item.estimatedBudgetDzd != null && ` · Budget: ${formatPrice(item.estimatedBudgetDzd)}`}
      </p>
      <p className="wishlist-card-options">
        {item.options.length} {item.options.length === 1 ? 'option' : 'options'} considered
      </p>
    </Link>
  )
}
