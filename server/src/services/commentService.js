import { Comment } from '../models/Comment.js'
import { Activity } from '../models/Activity.js'
import { ApiError } from '../utils/apiResponse.js'
import { create as createNotification } from './notifyService.js'

// Re-verifies the activity's CURRENT public status — never trusted from an
// earlier read. Both listing and creating a comment go through this, so a
// comment on an activity that has since flipped private is exactly as
// unreachable as the activity itself (docs/08_COMMUNITY_PROPOSAL.md §9).
async function assertActivityIsPublic(activityId) {
  const activity = await Activity.findOne({ _id: activityId, visibility: 'public' }).select('userId')
  if (!activity) {
    throw new ApiError(404, 'NOT_FOUND', 'Activity not found.')
  }
  return activity
}

function toCommentDTO(comment) {
  return {
    id: comment._id,
    activityId: comment.activityId,
    authorId: comment.userId?._id ?? comment.userId,
    // Populated when available — comments are inherently public-facing
    // once posted (unlike a feed card's author, which may have no public
    // profile at all), so showing who wrote a comment doesn't carry the
    // same "might link to something that 404s" concern noted for the
    // Explore feed cards in M4. Falls back to null gracefully if for any
    // reason the author reference didn't get populated.
    authorName: comment.userId?.name ?? null,
    authorUsername: comment.userId?.username ?? null,
    text: comment.text,
    editedAt: comment.editedAt,
    createdAt: comment.createdAt,
  }
}

// Cursor pagination, ascending (oldest first — a comment thread reads top
// to bottom like a conversation, unlike the feed's newest-first order).
export async function listComments(activityId, { cursor, limit = 20 } = {}) {
  await assertActivityIsPublic(activityId)

  const filter = { activityId }
  if (cursor) {
    const [createdAtIso, lastId] = cursor.split('_')
    filter.$or = [
      { createdAt: { $gt: new Date(createdAtIso) } },
      { createdAt: new Date(createdAtIso), _id: { $gt: lastId } },
    ]
  }

  const rows = await Comment.find(filter)
    .sort({ createdAt: 1, _id: 1 })
    .limit(limit + 1)
    .populate('userId', 'name username')

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const last = page[page.length - 1]
  const nextCursor = hasMore && last ? `${last.createdAt.toISOString()}_${last._id}` : null

  return { comments: page.map(toCommentDTO), nextCursor }
}

export async function createComment(userId, activityId, text) {
  const activity = await assertActivityIsPublic(activityId)

  const comment = await Comment.create({ activityId, userId, text })
  await comment.populate('userId', 'name username')

  await createNotification({
    recipientUserId: activity.userId,
    actorUserId: userId,
    type: 'comment',
    activityId,
    commentId: comment._id,
  })

  return toCommentDTO(comment)
}

export async function updateComment(userId, commentId, text) {
  const comment = await Comment.findById(commentId)
  if (!comment) {
    throw new ApiError(404, 'NOT_FOUND', 'Comment not found.')
  }
  if (String(comment.userId) !== String(userId)) {
    // 403, not a non-distinguishing 404: a comment on a public activity is
    // already publicly visible in the comment list, so there's no
    // existence to hide here — unlike a private resource, telling someone
    // "this exists but isn't yours" leaks nothing they couldn't already
    // see. This is a deliberate departure from the private-resource
    // 404 pattern used elsewhere, not an inconsistency.
    throw new ApiError(403, 'FORBIDDEN', 'You can only edit your own comments.')
  }

  comment.text = text
  comment.editedAt = new Date()
  await comment.save()
  await comment.populate('userId', 'name username')
  return toCommentDTO(comment)
}

// Named to match docs/08_COMMUNITY_PROPOSAL.md §5's documented helper
// exactly: "a new assertCanDeleteComment(userId, comment, activity)
// helper, following the codebase's existing assertXOwnership
// naming/shape convention."
export function assertCanDeleteComment(userId, comment, activity) {
  const isAuthor = String(comment.userId) === String(userId)
  const isActivityOwner = activity && String(activity.userId) === String(userId)
  if (!isAuthor && !isActivityOwner) {
    throw new ApiError(403, 'FORBIDDEN', 'You cannot delete this comment.')
  }
}

export async function deleteComment(userId, commentId) {
  const comment = await Comment.findById(commentId)
  if (!comment) {
    throw new ApiError(404, 'NOT_FOUND', 'Comment not found.')
  }

  const activity = await Activity.findById(comment.activityId).select('userId')
  assertCanDeleteComment(userId, comment, activity)

  // Hard delete, consistent with 05_DATA_MODEL_AND_API_CONTRACT.md §59's
  // existing default — no soft-delete requirement exists for comments.
  await Comment.deleteOne({ _id: commentId })
}
