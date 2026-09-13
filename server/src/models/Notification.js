import mongoose from 'mongoose'

// See docs/08_COMMUNITY_PROPOSAL.md §8.
// Written synchronously by notifyService.create() at the moment a kudos,
// comment, or follow happens — no queue, no background worker (consistent
// with this codebase's existing preference to avoid event-driven
// infrastructure it doesn't otherwise have or need; see
// 02_TECHNICAL_ARCHITECTURE.md §54).
const notificationSchema = new mongoose.Schema(
  {
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
      index: true,
    },
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['kudos', 'comment', 'follow', 'comment_like', 'reply'],
      required: true,
    },
    // Present for 'kudos', 'comment', 'comment_like', and 'reply'; null for 'follow'.
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null },
    // Present for 'comment', 'comment_like', and 'reply'; null otherwise.
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Inbox, newest first — the primary access pattern.
notificationSchema.index({ recipientUserId: 1, createdAt: -1 })
// Cheap unread-count badge, checked far more often than the inbox itself is opened.
notificationSchema.index({ recipientUserId: 1, isRead: 1 })

export const Notification = mongoose.model('Notification', notificationSchema)
