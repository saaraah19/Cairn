import { Notification } from '../models/Notification.js'
import { User } from '../models/User.js'
import { Activity } from '../models/Activity.js'
import { ApiError } from '../utils/apiResponse.js'

// Builds an inbox-safe DTO for a single notification. Unlike Community's
// public DTOs, this never needs a visibility check on the referenced
// activity — a kudos/comment notification's activityId always belongs to
// the *recipient* themselves, so a private activity is exactly as safe to
// show its own owner as a public one would be. What DOES need a fallback,
// per docs/08_COMMUNITY_PROPOSAL.md §8: the actor account, the activity,
// or (for a 'comment' notification) the comment itself may have since
// been deleted. Rather than throwing or attempting to re-fetch stale
// content, this renders a safe generic fallback — actor -> null (the
// frontend shows "Someone"), activity -> null (the frontend shows plain
// text with no dead link) — instead of erroring the whole inbox over one
// stale notification.
async function toNotificationDTO(notification) {
  const [actor, activity] = await Promise.all([
    User.findById(notification.actorUserId).select('name username'),
    notification.activityId ? Activity.findById(notification.activityId).select('name') : Promise.resolve(null),
  ])

  return {
    id: notification._id,
    type: notification.type,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
    actor: actor ? { name: actor.name, username: actor.username } : null,
    activity: activity ? { id: activity._id, name: activity.name } : null,
  }
}

// Cursor pagination (createdAt + _id tiebreaker) — the same shape as
// Community's paginatePublicActivities, matching the Notification model's
// own { recipientUserId, createdAt: -1 } index, applied here to a
// strictly personal (never public) list. Always scoped to the
// authenticated caller — never accepts or trusts any other userId.
export async function listNotifications(userId, { cursor, limit = 20 } = {}) {
  const filter = { recipientUserId: userId }

  if (cursor) {
    const [dateIso, lastId] = cursor.split('_')
    filter.$or = [{ createdAt: { $lt: new Date(dateIso) } }, { createdAt: new Date(dateIso), _id: { $lt: lastId } }]
  }

  const rows = await Notification.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  const notifications = await Promise.all(page.map(toNotificationDTO))
  const last = page[page.length - 1]
  const nextCursor = hasMore && last ? `${last.createdAt.toISOString()}_${last._id}` : null

  return { notifications, nextCursor }
}

export async function getUnreadCount(userId) {
  const count = await Notification.countDocuments({ recipientUserId: userId, isRead: false })
  return { count }
}

// Ownership-checked exactly like every other owned-resource operation in
// this codebase (docs/02_TECHNICAL_ARCHITECTURE.md §9): a notification
// that doesn't belong to the caller produces the same non-distinguishing
// 404 as one that doesn't exist at all — "a user can only ever read their
// own notifications" per docs/08_COMMUNITY_PROPOSAL.md §13 M9's test
// plan. Idempotent: marking an already-read notification read again is a
// safe no-op, not an error.
export async function markAsRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipientUserId: userId },
    { isRead: true },
    { returnDocument: 'after' }
  )
  if (!notification) {
    throw new ApiError(404, 'NOT_FOUND', 'Notification not found.')
  }
  return { id: notification._id, isRead: notification.isRead }
}

export async function markAllAsRead(userId) {
  await Notification.updateMany({ recipientUserId: userId, isRead: false }, { isRead: true })
  return { success: true }
}
