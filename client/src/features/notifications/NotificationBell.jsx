import { Link } from 'react-router-dom'
import { BellIcon } from '../../components/NavIcons.jsx'
import { useNotificationsContext } from './NotificationsContext.jsx'
import './NotificationBell.css'

// A small, unopinionated bell + badge — deliberately not a dropdown/panel:
// the notifications inbox is a real page (see NotificationsPage.jsx), not
// a hovering overlay, keeping this component tiny and reusable in both
// the desktop sidebar and the mobile header. Reads unreadCount from
// NotificationsContext rather than polling on its own — see that file for
// why (it's shared with NotificationsPage so mark-read reflects instantly).
export function NotificationBell() {
  const { unreadCount } = useNotificationsContext()

  return (
    <Link to="/notifications" className="notification-bell" aria-label="Notifications">
      <BellIcon />
      {unreadCount > 0 && <span className="notification-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
    </Link>
  )
}
