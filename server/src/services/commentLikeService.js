import { CommentLike } from '../models/CommentLike.js'
import { Comment } from '../models/Comment.js'
import { Activity } from '../models/Activity.js'
import { ApiError } from '../utils/apiResponse.js'
import { create as createNotification } from './notifyService.js'

// Duplicate-key error code from MongoDB — thrown when the unique
// { commentId, userId } index rejects a second insert.
const DUPLICATE_KEY_ERROR = 11000

// Re-verifies the comment (and its parent activity) are still genuinely
// reachable right now — same "never trust an earlier read" rule as every
// other public-eligibility check in Community (kudos, reports, follows).
// A comment on an activity that's since gone private is treated as not
// found, matching commentService's own re-verification rule exactly.
async function assertCommentIsLikeable(commentId) {
  const comment = await Comment.findById(commentId).select('userId activityId')
  if (!comment) {
    throw new ApiError(404, 'NOT_FOUND', 'Comment not found.')
  }
  const activity = await Activity.findOne({ _id: comment.activityId, visibility: 'public' }).select('_id')
  if (!activity) {
    throw new ApiError(404, 'NOT_FOUND', 'Comment not found.')
  }
  return comment
}

// Read-only "have I already liked this?" check, mirrors
// kudosService.hasUserGivenKudos exactly.
export async function hasUserLikedComment(userId, commentId) {
  if (!userId) return false
  const existing = await CommentLike.exists({ commentId, userId })
  return !!existing
}

// Same consistency strategy as kudosService.giveKudos, one level down —
// see that function's own comment for the full step-by-step reasoning.
// Self-liking your own comment is blocked, for consistency with Kudos's
// established self-interaction rule in this codebase (a 2026-09-13
// implementation default — revisit if that turns out to feel wrong in
// practice, since "liking your own comment" is more culturally ambiguous
// than "kudos-ing your own activity").
export async function likeComment(userId, commentId) {
  const comment = await assertCommentIsLikeable(commentId)

  if (String(comment.userId) === String(userId)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'You cannot like your own comment.')
  }

  let created
  try {
    created = await CommentLike.create({ commentId, userId })
  } catch (err) {
    if (err.code === DUPLICATE_KEY_ERROR) {
      const current = await Comment.findById(commentId).select('likesCount')
      return { likesCount: current?.likesCount ?? 0, hasLiked: true }
    }
    throw err
  }

  const updated = await Comment.findByIdAndUpdate(commentId, { $inc: { likesCount: 1 } }, { returnDocument: 'after' }).select(
    'likesCount'
  )

  if (!updated) {
    // Rare race: the comment was deleted between the check above and this
    // increment. Compensate by rolling back the like just created.
    await CommentLike.deleteOne({ _id: created._id })
    throw new ApiError(404, 'NOT_FOUND', 'Comment not found.')
  }

  await createNotification({
    recipientUserId: comment.userId,
    actorUserId: userId,
    type: 'comment_like',
    activityId: comment.activityId,
    commentId,
  })

  return { likesCount: updated.likesCount, hasLiked: true }
}

// Idempotent: unliking a comment you haven't liked is a no-op, not an
// error. The decrement is guarded against going negative, mirroring
// kudosService.removeKudos exactly.
export async function unlikeComment(userId, commentId) {
  const deleted = await CommentLike.findOneAndDelete({ commentId, userId })

  if (!deleted) {
    const comment = await Comment.findById(commentId).select('likesCount')
    return { likesCount: comment?.likesCount ?? 0, hasLiked: false }
  }

  const updated = await Comment.findOneAndUpdate(
    { _id: commentId, likesCount: { $gt: 0 } },
    { $inc: { likesCount: -1 } },
    { returnDocument: 'after' }
  ).select('likesCount')

  return { likesCount: updated?.likesCount ?? 0, hasLiked: false }
}
