import mongoose from 'mongoose'

// See docs/08_COMMUNITY_PROPOSAL.md §7. Deliberately minimal — no
// admin/moderator role or dashboard exists anywhere in this codebase, and
// building one is explicitly out of scope for this version (§16). This
// collection is durable storage for a real in-product "escape hatch": the
// report is filed and persisted, reviewed manually/out-of-band (e.g. a
// direct database query filtered on status: 'open'), not actioned by a UI.
const reportSchema = new mongoose.Schema(
  {
    reporterUserId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    // Interpreted per targetType — 'activity' -> Activity._id, 'comment' -> Comment._id.
    targetType: { type: String, required: true, enum: ['comment', 'activity'] },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    reason: {
      type: String,
      required: true,
      enum: ['spam', 'harassment', 'inappropriate_content', 'other'],
    },
    details: { type: String, trim: true, maxlength: 500, default: null },
    status: { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open' },
    // null until a report is manually reviewed and resolved/dismissed.
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// Primary spam-resistance mechanism: exactly one report per (reporter,
// target) pair, enforced at the database level, not merely in application
// code. A duplicate insert attempt is caught in reportService and turned
// into a clean 409, not left as a raw Mongo error.
reportSchema.index({ reporterUserId: 1, targetType: 1, targetId: 1 }, { unique: true })
// Ordered manual review, even without a dedicated UI.
reportSchema.index({ status: 1, createdAt: 1 })

export const Report = mongoose.model('Report', reportSchema)
