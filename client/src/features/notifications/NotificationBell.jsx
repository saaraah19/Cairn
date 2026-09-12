import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BellIcon } from '../../components/NavIcons.jsx'
import { getUnreadCountRequest } from './api.js'
import './NotificationBell.css'

// A small, unopinionated bell + badge — deliberately not a dropdown/panel:
// the notifications inbox is a real page (see NotificationsPage.jsx), not
// a hovering overlay, keeping this component tiny and reusable in both
// the desktop sidebar and the mobile header. Polls the unread count on an
// interval rather than pushing (no WebSocket/SSE infrastructure exists in
// the stack, and none is introduced for this — matches the in-app-only,
// no-queue stance in docs/08_COMMUNITY_PROPOSAL.md §8).
const POLL_INTERVAL_MS = 60_000

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    function refresh() {
      getUnreadCountRequest()
        .then((data) => {
          if (!cancelled) setUnreadCount(data.count)
        })
        .catch(() => {
          // A failed poll just leaves the last-known count showing —
          // not worth surfacing an error for a background badge refresh.
        })
    }

    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <Link to="/notifications" className="notification-bell" aria-label="Notifications">
      <BellIcon />
      {unreadCount > 0 && (
        <span className="notification-bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
      )}
    </Link>
  )
}
