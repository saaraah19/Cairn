import mongoose from 'mongoose'

// Mirrors Kudos.js exactly, one level down: this collection is the source
// of truth for "who liked which comment/reply" — Comment.likesCount is a
// derived, denormalized read-optimization, never the other way around.
// The unique index does the same two jobs as Kudos's: prevents duplicate
// likes at the database level, and serves "has user X liked comment Y?"
// lookups directly.
const commentLikeSchema = new mongoose.Schema(
  {
    commentId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Comment' },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

commentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true })

export const CommentLike = mongoose.model('CommentLike', commentLikeSchema)
