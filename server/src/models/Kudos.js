import mongoose from 'mongoose'

// See docs/08_COMMUNITY_PROPOSAL.md §4. This collection is the source of
// truth for "who gave kudos to what" — Activity.kudosCount is a derived,
// denormalized read-optimization, never the other way around. The unique
// index does three jobs at once: prevents duplicate kudos at the database
// level (not merely in application code), serves "has user X kudos'd
// activity Y?" lookups directly, and would serve a per-activity kudos
// listing if that's ever needed.
const kudosSchema = new mongoose.Schema(
  {
    activityId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Activity' },
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

kudosSchema.index({ activityId: 1, userId: 1 }, { unique: true })

export const Kudos = mongoose.model('Kudos', kudosSchema)
