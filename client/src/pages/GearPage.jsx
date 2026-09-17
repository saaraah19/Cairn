import { useState } from 'react'
import { GearList } from '../features/gear/GearList.jsx'
import { GearWishlistList } from '../features/gearWishlist/GearWishlistList.jsx'
import './pages.css'
import './GearPage.css'

const TABS = [
  { key: 'closet', label: 'Gear Closet' },
  { key: 'wishlist', label: 'Need to Buy' },
]

export function GearPage() {
  const [tab, setTab] = useState('closet')

  return (
    <div>
      <div className="page-header">
        <h1>Gear</h1>
        <p>Your personal outdoor closet.</p>
      </div>

      <div className="gear-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`gear-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'closet' && <GearList />}
      {tab === 'wishlist' && <GearWishlistList />}
    </div>
  )
}
