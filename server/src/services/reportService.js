import { Report } from '../models/Report.js'
import { Activity } from '../models/Activity.js'
import { Comment } from '../models/Comment.js'
import { ApiError } from '../utils/apiResponse.js'

// Duplicate-key error code from MongoDB — thrown when the unique
// { reporterUserId, targetType, targetId } index rejects a second insert.
const DUPLICATE_KEY_ERROR = 11000

// Resolves a report target to its current owner, re-verifying the target
// is still genuinely public right now — same "never trust an earlier
// read" reasoning as commentService.assertActivityIsPublic and
// kudosService.giveKudos. A target that has gone private (or never
// existed) is treated as not found, matching every other public-read path
// in Community.
async function resolveTarget(targetType, targetId) {
  if (targetType === 'activity') {
    const activity = await Activity.findOne({ _id: targetId, visibility: 'public' }).select('userId')
    if (!activity) {
      throw new ApiError(404, 'NOT_FOUND', 'Activity not found.')
    }
    return { ownerId: activity.userId }
  }

  // targetType === 'comment' (the validator enforces there is no other value)
  const comment = await Comment.findById(targetId).select('userId activityId')
  if (!comment) {
    throw new ApiError(404, 'NOT_FOUND', 'Comment not found.')
  }
  // A comment only remains reachable while its parent activity is public —
  // same rule commentService already applies to listing/creating comments.
  const activity = await Activity.findOne({ _id: comment.activityId, visibility: 'public' }).select('_id')
  if (!activity) {
    throw new ApiError(404, 'NOT_FOUND', 'Comment not found.')
  }
  return { ownerId: comment.userId }
}

// Rules per docs/08_COMMUNITY_PROPOSAL.md §7:
//   - Self-reporting is blocked (the owner already has direct delete
//     rights over their own content, so a self-report has no purpose).
//   - A duplicate report from the same user on the same target is
//     rejected — the unique index is the real enforcement; a duplicate-key
//     error here is translated into a clean 409, not left as a raw Mongo
//     error (deliberately NOT idempotent-success like Kudos, since a
//     rejected duplicate is the documented test-plan behavior for
//     Reporting specifically).
//   - Reporting a nonexistent (or now-private) target fails cleanly via
//     resolveTarget's 404.
export async function createReport(userId, targetType, targetId, reason, details) {
  const { ownerId } = await resolveTarget(targetType, targetId)

  if (String(ownerId) === String(userId)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'You cannot report your own content.')
  }

  try {
    const report = await Report.create({
      reporterUserId: userId,
      targetType,
      targetId,
      reason,
      details: details || null,
    })
    return { id: report._id, status: report.status }
  } catch (err) {
    if (err.code === DUPLICATE_KEY_ERROR) {
      throw new ApiError(409, 'ALREADY_REPORTED', 'You have already reported this.')
    }
    throw err
  }
}
