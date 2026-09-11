import { Notification } from '../models/Notification.js'

// Shared write helper, used by later milestones (Kudos, Comments, Following)
// so each of them calls one place rather than duplicating notification-
// creation logic. See docs/08_COMMUNITY_PROPOSAL.md §8 for the full event
// model. Not exposed via any route — internal service-to-service use only.
//
// Self-notifications are suppressed here (not by every caller individually):
// notifying someone that they interacted with their own content has no
// value, and centralizing the check means no future call site can forget it.
export async function create({ recipientUserId, actorUserId, type, activityId = null, commentId = null }) {
  if (String(recipientUserId) === String(actorUserId)) {
    return null
  }

  return Notification.create({
    recipientUserId,
    actorUserId,
    type,
    activityId,
    commentId,
  })
}
