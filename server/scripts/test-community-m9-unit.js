// M9 — Notifications Inbox: mocked unit verification.
//
// Same sandbox limitation as M1-M8 (no MongoDB reachable here). Property
// under test, per docs/08_COMMUNITY_PROPOSAL.md §8/§13 M9: a user can
// only ever read/modify their own notifications (ownership-checked, same
// non-distinguishing 404 as any other owned resource); broken/stale
// references (deleted comment/actor, or an activity that's since been
// deleted) render safely with a generic fallback rather than erroring or
// re-fetching; mark-read and mark-all-read are idempotent; pagination
// doesn't skip/duplicate across pages (same cursor shape already proven
// correct for Community feeds in M4).
//
// Usage: node scripts/test-community-m9-unit.js

import { Notification } from '../src/models/Notification.js'
import { User } from '../src/models/User.js'
import { Activity } from '../src/models/Activity.js'
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../src/services/notificationService.js'

let failures = 0
function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`)
    failures += 1
  } else {
    console.log(`✓ ${message}`)
  }
}

let notifications
let users
let activities

function resetFixtures() {
  notifications = [
    {
      _id: 'notif-5',
      recipientUserId: 'user-recipient',
      actorUserId: 'user-actor',
      type: 'kudos',
      activityId: 'activity-1',
      commentId: null,
      isRead: false,
      createdAt: new Date('2026-07-05'),
    },
    {
      _id: 'notif-4',
      recipientUserId: 'user-recipient',
      actorUserId: 'user-deleted-actor',
      type: 'comment',
      activityId: 'activity-1',
      commentId: 'comment-deleted',
      isRead: false,
      createdAt: new Date('2026-07-04'),
    },
    {
      _id: 'notif-3',
      recipientUserId: 'user-recipient',
      actorUserId: 'user-actor',
      type: 'kudos',
      activityId: 'activity-deleted',
      commentId: null,
      isRead: true,
      createdAt: new Date('2026-07-03'),
    },
    {
      _id: 'notif-2',
      recipientUserId: 'user-recipient',
      actorUserId: 'user-actor',
      type: 'follow',
      activityId: null,
      commentId: null,
      isRead: false,
      createdAt: new Date('2026-07-02'),
    },
    {
      _id: 'notif-1',
      recipientUserId: 'someone-else-entirely',
      actorUserId: 'user-actor',
      type: 'kudos',
      activityId: 'activity-1',
      commentId: null,
      isRead: false,
      createdAt: new Date('2026-07-01'),
    },
  ]
  users = [
    { _id: 'user-actor', name: 'Actor Person', username: 'actorperson' },
    // 'user-deleted-actor' deliberately absent — simulates a deleted account.
  ]
  activities = [
    { _id: 'activity-1', name: 'A Real Activity' },
    // 'activity-deleted' deliberately absent — simulates a deleted activity.
  ]
}

function installMocks() {
  Notification.find = (filter) => {
    const matched = notifications.filter((n) => {
      if (n.recipientUserId !== filter.recipientUserId) return false
      if (filter.$or) {
        return filter.$or.some((clause) => {
          if ('createdAt' in clause && clause.createdAt instanceof Date) {
            return n.createdAt.getTime() === clause.createdAt.getTime() && n._id < clause._id
          }
          if (clause.createdAt?.$lt) {
            return n.createdAt < clause.createdAt.$lt
          }
          return false
        })
      }
      return true
    })
    const sorted = [...matched].sort((a, b) => b.createdAt - a.createdAt || (a._id < b._id ? 1 : -1))
    return {
      sort() {
        return this
      },
      limit(n) {
        return Promise.resolve(sorted.slice(0, n))
      },
    }
  }

  Notification.countDocuments = async (filter) =>
    notifications.filter((n) => n.recipientUserId === filter.recipientUserId && n.isRead === filter.isRead).length

  Notification.findOneAndUpdate = async (filter) => {
    const found = notifications.find((n) => n._id === filter._id && n.recipientUserId === filter.recipientUserId)
    if (!found) return null
    found.isRead = true
    return { ...found }
  }

  Notification.updateMany = async (filter) => {
    notifications
      .filter((n) => n.recipientUserId === filter.recipientUserId && n.isRead === false)
      .forEach((n) => {
        n.isRead = true
      })
  }

  User.findById = (id) => ({
    select: () => Promise.resolve(users.find((u) => u._id === id) ?? null),
  })

  Activity.findById = (id) => ({
    select: () => Promise.resolve(activities.find((a) => a._id === id) ?? null),
  })
}

async function run() {
  console.log('=== M9 — Notifications Inbox: mocked unit verification ===\n')
  installMocks()

  // 1. Listing only ever returns the caller's own notifications — the
  //    fixture includes one belonging to a completely different user,
  //    which must never appear.
  resetFixtures()
  const { notifications: page1, nextCursor } = await listNotifications('user-recipient', { limit: 3 })
  assert(page1.length === 3, 'First page returns exactly `limit` items (3)')
  assert(
    page1.every((n) => n.id !== 'notif-1'),
    "Another user's notification never appears in this user's inbox"
  )
  assert(nextCursor != null, 'A nextCursor is returned when more pages exist')

  // 2. Pagination doesn't skip or duplicate across pages.
  const { notifications: page2 } = await listNotifications('user-recipient', { limit: 3, cursor: nextCursor })
  const page1Ids = new Set(page1.map((n) => String(n.id)))
  const page2Ids = new Set(page2.map((n) => String(n.id)))
  const overlap = [...page1Ids].filter((id) => page2Ids.has(id))
  assert(overlap.length === 0, 'Page 2 does not repeat any id already seen on page 1')
  assert(page2.length === 1, 'Page 2 returns exactly the one remaining notification')

  // 3. A notification whose actor account was deleted renders a safe
  //    generic fallback (actor: null) rather than erroring the whole list.
  const commentNotif = page1.find((n) => n.type === 'comment')
  assert(commentNotif.actor === null, "A deleted actor's notification renders actor: null, not an error")
  assert(commentNotif.activity?.name === 'A Real Activity', 'That same notification still resolves its (intact) activity normally')

  // 4. A notification whose activity was deleted renders activity: null,
  //    also without erroring.
  const allForRecipient = [...page1, ...page2]
  const kudosOnDeletedActivity = allForRecipient.find((n) => n.id === 'notif-3')
  assert(kudosOnDeletedActivity.activity === null, "A notification referencing a deleted activity renders activity: null, not an error")
  assert(kudosOnDeletedActivity.actor?.name === 'Actor Person', 'That notification still resolves its (intact) actor normally')

  // 5. A 'follow' notification has no activity reference at all.
  const followNotif = allForRecipient.find((n) => n.type === 'follow')
  assert(followNotif.activity === null, 'A follow notification has activity: null (never had one)')
  assert(followNotif.actor?.username === 'actorperson', 'A follow notification still resolves its actor normally')

  // 6. Unread count reflects only this user's unread notifications.
  const unread = await getUnreadCount('user-recipient')
  assert(unread.count === 3, 'Unread count is exactly 3 (notif-5, notif-4, notif-2 are unread; notif-3 is already read)')

  // 7. Marking someone else's notification as read is rejected (404) —
  //    "a user can only ever read their own notifications."
  try {
    await markAsRead('user-recipient', 'notif-1')
    assert(false, "Marking another user's notification as read throws")
  } catch (err) {
    assert(err.status === 404, "Marking another user's notification as read throws 404")
  }

  // 8. Marking a nonexistent notification as read is rejected (404).
  try {
    await markAsRead('user-recipient', 'notif-does-not-exist')
    assert(false, 'Marking a nonexistent notification as read throws')
  } catch (err) {
    assert(err.status === 404, 'Marking a nonexistent notification as read throws 404')
  }

  // 9. Marking your own notification as read succeeds and is idempotent.
  const markResult = await markAsRead('user-recipient', 'notif-5')
  assert(markResult.isRead === true, "Marking one's own notification as read succeeds")
  const markAgain = await markAsRead('user-recipient', 'notif-5')
  assert(markAgain.isRead === true, 'Marking an already-read notification as read again is a safe no-op')

  const unreadAfterOneRead = await getUnreadCount('user-recipient')
  assert(unreadAfterOneRead.count === 2, 'Unread count drops by exactly one after marking one notification read')

  // 10. Mark-all-read clears every remaining unread notification for this
  //     user, and this user only.
  await markAllAsRead('user-recipient')
  const unreadAfterMarkAll = await getUnreadCount('user-recipient')
  assert(unreadAfterMarkAll.count === 0, 'Unread count is 0 after mark-all-read')
  const otherUserUnread = await getUnreadCount('someone-else-entirely')
  assert(otherUserUnread.count === 1, "mark-all-read for one user never touches another user's unread notifications")

  console.log(`\n${failures === 0 ? '✓ All M9 mocked unit checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
