import { Follow } from '../models/Follow.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiResponse.js'
import { create as createNotification } from './notifyService.js'

// Duplicate-key error code from MongoDB — thrown when the unique
// { followerId, followingId } index rejects a second insert.
const DUPLICATE_KEY_ERROR = 11000

// A user may only be followed while their profile is currently public —
// re-verified live here, same "never trust an earlier read" rule as every
// other public-eligibility check in Community (comments, kudos, reports).
async function resolveFollowableUser(username) {
  const user = await User.findOne({ username, isPublicProfile: true }).select('_id')
  if (!user) {
    throw new ApiError(404, 'NOT_FOUND', 'Profile not found.')
  }
  return user._id
}

// Read-only "is A already following B?" check, used to attach a per-viewer
// isFollowing flag to a public profile response — mirrors
// kudosService.hasUserGivenKudos exactly. Never used for an authorization
// decision on its own.
export async function isFollowing(followerId, followingId) {
  if (!followerId) return false
  const existing = await Follow.exists({ followerId, followingId })
  return !!existing
}

// Rules per docs/08_COMMUNITY_PROPOSAL.md §6:
//   - Self-follow is blocked (422) — no coherent product meaning otherwise.
//   - Following a non-public-profile (or nonexistent) user is rejected
//     (404), matching the same non-distinguishing 404 the profile page
//     itself already uses for a private/nonexistent username.
//   - A duplicate follow (already following) does NOT error — it's
//     treated as an idempotent success, the same design Kudos uses for
//     the same reason: the target state ("A follows B") is identical
//     either way and no information would be lost by silently accepting
//     it, unlike a duplicate Report, which would represent a genuinely
//     redundant moderation-queue entry.
export async function followUserByUsername(followerId, username) {
  const followingId = await resolveFollowableUser(username)

  if (String(followingId) === String(followerId)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'You cannot follow yourself.')
  }

  try {
    await Follow.create({ followerId, followingId })
  } catch (err) {
    if (err.code === DUPLICATE_KEY_ERROR) {
      return { isFollowing: true }
    }
    throw err
  }

  await createNotification({
    recipientUserId: followingId,
    actorUserId: followerId,
    type: 'follow',
  })

  return { isFollowing: true }
}

// Unfollowing is idempotent per §13 M8's test plan: unfollowing a user
// you don't currently follow (or whose profile has since gone private, or
// who no longer exists) is a safe no-op, not an error. Deliberately not
// gated behind isPublicProfile like the follow-write path — the resolved
// edge case in §6 is explicit that an existing Follow relationship (and
// therefore the ability to end it) survives a profile going private.
export async function unfollowUserByUsername(followerId, username) {
  const user = await User.findOne({ username }).select('_id')
  if (!user) {
    return { isFollowing: false }
  }
  await Follow.deleteOne({ followerId, followingId: user._id })
  return { isFollowing: false }
}
