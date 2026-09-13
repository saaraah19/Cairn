import { createContext, useContext, useCallback, useEffect, useState } from 'react'
import { getUnreadCountRequest } from './api.js'

// NotificationBell (in the sidebar/mobile header) and NotificationsPage
// (the /notifications route) are siblings, not parent/child — without a
// shared source of truth, marking something read on the page would have
// no way to tell the bell about it, and the badge would only catch up on
// the next 60s poll or a full page reload. This context is that shared
// source of truth: the bell reads `unreadCount`, and the page calls
// `decrementUnread`/`clearUnread` right after a successful mark-read
// call so the badge updates in the same tick as the click.
const NotificationsContext = createContext(null)

// Polling, not push — no WebSocket/SSE infrastructure exists in the stack
// and none is introduced for this, matching the in-app-only, no-queue
// stance in docs/08_COMMUNITY_PROPOSAL.md §8. A poll on window focus /
// tab-visibility change is added on top of the interval so returning to
// an already-open tab still picks up anything that happened elsewhere
// (e.g. someone else's kudos) without waiting the full interval out.
const POLL_INTERVAL_MS = 60_000

export function NotificationsProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(() => {
    getUnreadCountRequest()
      .then((data) => setUnreadCount(data.count))
      .catch(() => {
        // A failed background refresh just leaves the last-known count
        // showing — not worth surfacing an error for this.
      })
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, POLL_INTERVAL_MS)

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', refresh)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])

  const decrementUnread = useCallback((by = 1) => {
    setUnreadCount((prev) => Math.max(0, prev - by))
  }, [])

  const clearUnread = useCallback(() => setUnreadCount(0), [])

  return (
    <NotificationsContext.Provider value={{ unreadCount, refresh, decrementUnread, clearUnread }}>
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotificationsContext() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotificationsContext must be used within a NotificationsProvider')
  }
  return ctx
}
