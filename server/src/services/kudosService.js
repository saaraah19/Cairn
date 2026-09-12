import { Kudos } from '../models/Kudos.js'
import { Activity } from '../models/Activity.js'
import { ApiError } from '../utils/apiResponse.js'
import { create as createNotification } from './notifyService.js'

// Duplicate-key error code from MongoDB — thrown when the unique
// { activityId, userId } index rejects a second insert.
const DUPLICATE_KEY_ERROR = 11000

// Read-only "have I already kudos'd this?" check, used by the public
// activity DTO for a logged-in viewer. Never used for authorization
// decisions on its own — give/removeKudos always re-verify independently.
export async function hasUserGivenKudos(userId, activityId) {
  if (!userId) return false
  const existing = await Kudos.exists({ activityId, userId })
  return !!existing
}

// Full consistency strategy — see docs/08_COMMUNITY_PROPOSAL.md §4 for the
// complete reasoning. Summary:
//   1. Reject self-kudos and non-public targets up front.
//   2. Insert the Kudos document — the unique index is the actual dedup
//      enforcement; a duplicate-key error here means "already given," which
//      is treated as an idempotent success, not an error.
//   3. Only if step 2 genuinely created a new document, atomically
//      increment the counter with a re-verified visibility guard (closes
//      the narrow race where the activity went private between step 1 and
//      step 3).
//   4. If step 3's guard fails (the rare race), compensate by deleting the
//      Kudos document just created in step 2 — a simple two-step
//      compensating action, not a MongoDB transaction (this codebase has
//      no existing transaction usage; see docs/08_COMMUNITY_PROPOSAL.md §0
//      and §4 for why that's a deliberate choice here).
//   5. Only a genuine new kudos (not the idempotent-duplicate path) creates
//      a notification.
export async function giveKudos(userId, activityId) {
  const activity = await Activity.findOne({ _id: activityId, visibility: 'public' }).select('userId')
  if (!activity) {
    throw new ApiError(404, 'NOT_FOUND', 'Activity not found.')
  }

  if (String(activity.userId) === String(userId)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'You cannot give kudos to your own activity.')
  }

  let created
  try {
    created = await Kudos.create({ activityId, userId })
  } catch (err) {
    if (err.code === DUPLICATE_KEY_ERROR) {
      // Idempotent no-op — already given. No counter change, no notification.
      const current = await Activity.findById(activityId).select('kudosCount')
      return { kudosCount: current?.kudosCount ?? 0, hasKudos: true }
    }
    throw err
  }

  const updated = await Activity.findOneAndUpdate(
    { _id: activityId, visibility: 'public' },
    { $inc: { kudosCount: 1 } },
    { returnDocument: 'after' }
  ).select('kudosCount')

  if (!updated) {
    // Rare race: the activity went private between the check above and this
    // increment. Compensate by rolling back the Kudos doc rather than
    // leaving an orphaned kudos record pointing at a now-private activity.
    await Kudos.deleteOne({ _id: created._id })
    throw new ApiError(404, 'NOT_FOUND', 'Activity not found.')
  }

  await createNotification({
    recipientUserId: activity.userId,
    actorUserId: userId,
    type: 'kudos',
    activityId,
  })

  return { kudosCount: updated.kudosCount, hasKudos: true }
}

// Idempotent: removing a kudos that doesn't exist is a no-op, not an
// error. The decrement is guarded against going negative
// (`kudosCount: { $gt: 0 }`) so a hypothetical double-request race can
// never push the counter below zero. Per docs/08_COMMUNITY_PROPOSAL.md §4,
// the historical notification created when the kudos was originally given
// is deliberately NOT retracted here.
export async function removeKudos(userId, activityId) {
  const deleted = await Kudos.findOneAndDelete({ activityId, userId })

  if (!deleted) {
    const activity = await Activity.findById(activityId).select('kudosCount')
    return { kudosCount: activity?.kudosCount ?? 0, hasKudos: false }
  }

  const updated = await Activity.findOneAndUpdate(
    { _id: activityId, kudosCount: { $gt: 0 } },
    { $inc: { kudosCount: -1 } },
    { returnDocument: 'after' }
  ).select('kudosCount')

  return { kudosCount: updated?.kudosCount ?? 0, hasKudos: false }
}
