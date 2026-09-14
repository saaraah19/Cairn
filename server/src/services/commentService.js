import { Comment } from '../models/Comment.js'
import { Activity } from '../models/Activity.js'
import { ApiError } from '../utils/apiResponse.js'
import { create as createNotification } from './notifyService.js'
import { hasUserLikedComment } from './commentLikeService.js'

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

async function toCommentDTO(comment, viewerUserId) {
  return {
    id: comment._id,
    activityId: comment.activityId,
    parentCommentId: comment.parentCommentId,
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
    likesCount: comment.likesCount ?? 0,
    hasLiked: await hasUserLikedComment(viewerUserId, comment._id),
  }
}

// Fetches a top-level comment's replies. Eager, not separately paginated —
// deliberately: replies are capped at one level (a reply can never itself
// be replied to, enforced in createComment below), so a single thread's
// reply count stays naturally bounded by ordinary conversation size,
// unlike top-level comments on a popular activity. Introducing cursor
// pagination here would be complexity this shape doesn't need yet.
async function listReplies(parentCommentId, viewerUserId) {
  const rows = await Comment.find({ parentCommentId }).sort({ createdAt: 1 }).populate('userId', 'name username')
  return Promise.all(rows.map((r) => toCommentDTO(r, viewerUserId)))
}

// Cursor pagination, ascending (oldest first — a comment thread reads top
// to bottom like a conversation, unlike the feed's newest-first order).
// Only paginates TOP-LEVEL comments (parentCommentId: null); each one's
// replies are attached eagerly via listReplies, per that function's own
// comment on why that's an acceptable simplicity trade-off here.
export async function listComments(activityId, { cursor, limit = 20, viewerUserId } = {}) {
  await assertActivityIsPublic(activityId)

  const filter = { activityId, parentCommentId: null }
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

  const comments = await Promise.all(
    page.map(async (comment) => {
      const dto = await toCommentDTO(comment, viewerUserId)
      dto.replies = await listReplies(comment._id, viewerUserId)
      return dto
    })
  )

  return { comments, nextCursor }
}

// `parentCommentId` is optional — omitted (or null) for a top-level
// comment. When present, per docs/08_COMMUNITY_PROPOSAL.md §5's 2026-09-13
// revision (one level of replies, to let "wow, where is this?" get an
// answer): the parent must exist, belong to the SAME activity (a client
// can't reply into a different activity's thread by guessing an id from
// elsewhere), and must itself be a top-level comment — replying to a
// reply is rejected outright, keeping threading capped at one level.
export async function createComment(userId, activityId, text, parentCommentId = null) {
  const activity = await assertActivityIsPublic(activityId)

  let notifyRecipientId = activity.userId
  let notificationType = 'comment'

  if (parentCommentId) {
    const parent = await Comment.findById(parentCommentId).select('activityId parentCommentId userId')
    if (!parent || String(parent.activityId) !== String(activityId)) {
      throw new ApiError(404, 'NOT_FOUND', 'Comment not found.')
    }
    if (parent.parentCommentId) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'You can only reply to a top-level comment, not to another reply.')
    }
    // A reply notifies the person who asked, not the activity owner again
    // (who was already notified when the top-level comment was first
    // posted) — see createNotification's own self-notification suppression
    // for what happens when the parent's author IS the activity owner.
    notifyRecipientId = parent.userId
    notificationType = 'reply'
  }

  const comment = await Comment.create({ activityId, userId, text, parentCommentId })
  await comment.populate('userId', 'name username')

  // Same denormalized-counter pattern as Kudos: Comment is the real
  // source of truth, Activity.commentsCount is a display-speed cache kept
  // in sync here and in deleteComment below. Counts replies too — it's a
  // "conversation size" number, not a top-level-thread count.
  await Activity.findByIdAndUpdate(activityId, { $inc: { commentsCount: 1 } })

  await createNotification({
    recipientUserId: notifyRecipientId,
    actorUserId: userId,
    type: notificationType,
    activityId,
    commentId: comment._id,
  })

  const dto = await toCommentDTO(comment, userId)
  dto.replies = []
  return dto
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
  return toCommentDTO(comment, userId)
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

  // Deleting a top-level comment also deletes its replies — an orphaned
  // reply pointing at a deleted parent has no coherent place to render.
  // (A reply itself has no children, by construction, so this is a single
  // extra step, not a recursive cascade.) The reply count is needed
  // before the delete to decrement commentsCount correctly for both the
  // comment itself AND every reply it took with it.
  const deletedReplies = await Comment.countDocuments({ parentCommentId: commentId })
  await Comment.deleteMany({ parentCommentId: commentId })

  // Hard delete, consistent with 05_DATA_MODEL_AND_API_CONTRACT.md §59's
  // existing default — no soft-delete requirement exists for comments.
  await Comment.deleteOne({ _id: commentId })

  await Activity.findOneAndUpdate(
    { _id: comment.activityId, commentsCount: { $gte: 1 + deletedReplies } },
    { $inc: { commentsCount: -(1 + deletedReplies) } }
  )
}
