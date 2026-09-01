import { useState } from 'react'
import { ActivitiesList } from '../features/activities/ActivitiesList.jsx'
import { PlannedActivitiesList } from '../features/plannedActivities/PlannedActivitiesList.jsx'
import { DestinationList } from '../features/destinations/DestinationList.jsx'
import './pages.css'
import './MyOutdoorsPage.css'

const TABS = [
  { key: 'activities', label: 'Activities' },
  { key: 'planned', label: 'Planned' },
  { key: 'destinations', label: 'Destinations' },
]

export function MyOutdoorsPage() {
  const [tab, setTab] = useState('activities')

  return (
    <div>
      <div className="page-header">
        <h1>My Outdoors</h1>
        <p>Activities, planned adventures, and destinations — your personal workspace.</p>
      </div>

      <div className="outdoors-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`outdoors-tab${tab === t.key ? ' active' : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'activities' && <ActivitiesList />}

      {tab === 'planned' && <PlannedActivitiesList />}

      {tab === 'destinations' && <DestinationList />}
    </div>
  )
}
