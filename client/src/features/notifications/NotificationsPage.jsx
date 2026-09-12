import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getNotificationsRequest,
  markNotificationReadRequest,
  markAllNotificationsReadRequest,
} from './api.js'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { formatDate } from '../activities/formatters.js'
import './NotificationsPage.css'
import '../../pages/pages.css'

// A single, human sentence per notification type. Actor/activity name are
// interpolated where present; a deleted actor or activity — rendered as
// null by notificationService — falls back to "Someone" / "an activity"
// rather than a broken reference or a crash, per docs/08_COMMUNITY_
// PROPOSAL.md §8.
function describeNotification(notification) {
  const actorName = notification.actor?.name ?? 'Someone'
  const activityName = notification.activity?.name

  if (notification.type === 'kudos') {
    return activityName ? (
      <>
        <strong>{actorName}</strong> gave kudos on <strong>{activityName}</strong>
      </>
    ) : (
      <>
        <strong>{actorName}</strong> gave kudos on one of your activities
      </>
    )
  }

  if (notification.type === 'comment') {
    return activityName ? (
      <>
        <strong>{actorName}</strong> commented on <strong>{activityName}</strong>
      </>
    ) : (
      <>
        <strong>{actorName}</strong> commented on one of your activities
      </>
    )
  }

  // 'follow'
  return (
    <>
      <strong>{actorName}</strong> started following you
    </>
  )
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getNotificationsRequest({})
      .then((data) => {
        if (cancelled) return
        setNotifications(data.notifications)
        setNextCursor(data.nextCursor)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function loadMore() {
    if (!nextCursor) return
    setIsLoadingMore(true)
    getNotificationsRequest({ cursor: nextCursor })
      .then((data) => {
        setNotifications((prev) => [...prev, ...data.notifications])
        setNextCursor(data.nextCursor)
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoadingMore(false))
  }

  function handleMarkRead(notification) {
    if (notification.isRead) return
    // Optimistic — this is a low-stakes, easily-reversible UI state, not
    // data that needs to round-trip before reflecting locally.
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)))
    markNotificationReadRequest(notification.id).catch(() => {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: false } : n)))
    })
  }

  function handleMarkAllRead() {
    setIsMarkingAll(true)
    const previous = notifications
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    markAllNotificationsReadRequest()
      .catch(() => setNotifications(previous))
      .finally(() => setIsMarkingAll(false))
  }

  const hasUnread = notifications.some((n) => !n.isRead)

  return (
    <div>
      <div className="page-header notifications-page-header">
        <div>
          <h1>Notifications</h1>
          <p>Kudos, comments, and new followers on your public activities.</p>
        </div>
        {hasUnread && (
          <button type="button" onClick={handleMarkAllRead} disabled={isMarkingAll} className="notifications-mark-all">
            {isMarkingAll ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {isLoading && <LoadingState label="Loading notifications…" />}

      {!isLoading && error && <EmptyState title="Couldn't load notifications" description={error} />}

      {!isLoading && !error && notifications.length === 0 && (
        <EmptyState
          title="Nothing here yet."
          description="Kudos, comments, and follows on your public activities will show up here."
        />
      )}

      {!isLoading && !error && notifications.length > 0 && (
        <>
          <ul className="notifications-list">
            {notifications.map((notification) => {
              const content = (
                <div
                  className={`notifications-item${notification.isRead ? '' : ' unread'}`}
                  onClick={() => handleMarkRead(notification)}
                >
                  <p>{describeNotification(notification)}</p>
                  <span className="notifications-item-date">{formatDate(notification.createdAt)}</span>
                </div>
              )
              return (
                <li key={notification.id}>
                  {notification.activity ? (
                    <Link to={`/community/activities/${notification.activity.id}`} className="notifications-item-link">
                      {content}
                    </Link>
                  ) : (
                    content
                  )}
                </li>
              )
            })}
          </ul>

          {nextCursor && (
            <div className="notifications-load-more">
              <button onClick={loadMore} disabled={isLoadingMore}>
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
