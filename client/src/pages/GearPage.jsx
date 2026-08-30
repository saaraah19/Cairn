import { GearList } from '../features/gear/GearList.jsx'
import './pages.css'

export function GearPage() {
  return (
    <div>
      <div className="page-header">
        <h1>Gear</h1>
        <p>Your personal outdoor closet.</p>
      </div>
      <GearList />
    </div>
  )
}
