import mongoose from 'mongoose'

// See docs/08_COMMUNITY_PROPOSAL.md §5. Deliberately flat — no
// parentCommentId, no threading, matching the explicit product decision
// to keep comments one level only. No mediaUrl, no mentions array —
// deliberately absent, same reasoning.
const commentSchema = new mongoose.Schema(
  {
    activityId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Activity' },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    text: { type: String, required: true, trim: true, maxlength: 1000 },
    // null until edited; the client renders "(edited)" when this is set.
    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// The only access pattern comments need: chronological listing per activity.
commentSchema.index({ activityId: 1, createdAt: 1 })

export const Comment = mongoose.model('Comment', commentSchema)
