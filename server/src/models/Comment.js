import mongoose from 'mongoose'

// See docs/08_COMMUNITY_PROPOSAL.md §5. Originally deliberately flat — no
// parentCommentId, no threading. Revised 2026-09-13: a product decision to
// allow ONE level of replies (so "wow, where is this place?" can get an
// answer) and likes on both comments and replies. Still deliberately NOT
// full arbitrary-depth threading — `parentCommentId` may only ever point
// at a TOP-LEVEL comment (one with parentCommentId: null); a reply may
// never itself be replied to. That one-level cap is enforced in
// commentService.js, not at the schema level. No mediaUrl, no mentions
// array — still deliberately absent, same reasoning as before.
const commentSchema = new mongoose.Schema(
  {
    activityId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Activity' },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    // null for a top-level comment; set for a reply. Always references a
    // comment that itself has parentCommentId: null (enforced in
    // commentService.createComment, not here).
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    // null until edited; the client renders "(edited)" when this is set.
    editedAt: { type: Date, default: null },
    // Denormalized counter, same pattern as Activity.kudosCount — the
    // CommentLike collection (unique per {userId,commentId}) remains the
    // real source of truth; this is a display-speed cache kept in sync by
    // commentLikeService's atomic $inc/$dec with compensating rollback.
    likesCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
)

// The only access patterns comments need: chronological listing of
// top-level comments per activity, and fetching one comment's replies.
commentSchema.index({ activityId: 1, parentCommentId: 1, createdAt: 1 })

export const Comment = mongoose.model('Comment', commentSchema)

