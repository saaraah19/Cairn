import mongoose from 'mongoose'

// See docs/08_COMMUNITY_PROPOSAL.md §6. Deliberately a single index at
// this stage — the { followingId, createdAt } index that would serve a
// followers-list/followers-count feature is explicitly deferred, since
// neither feature exists yet. The Following feed doesn't need it either:
// it goes followerId -> followingId list (served by this index's prefix),
// then queries Activity directly (see communityService.listPublicFeed).
const followSchema = new mongoose.Schema(
  {
    followerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    followingId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

// The only index. Prevents duplicate follows at the database level and
// directly serves "is A already following B?" lookups.
followSchema.index({ followerId: 1, followingId: 1 }, { unique: true })

export const Follow = mongoose.model('Follow', followSchema)
