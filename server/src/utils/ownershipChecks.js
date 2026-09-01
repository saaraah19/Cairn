import { Group } from '../models/Group.js'
import { GearItem } from '../models/GearItem.js'
import { Destination } from '../models/Destination.js'
import { ApiError } from './apiResponse.js'

// Verifies a referenced Group belongs to the authenticated user before it
// can be attached to an activity or planned activity — never trust a
// client-supplied ID (docs/05_DATA_MODEL_AND_API_CONTRACT.md §55).
export async function assertGroupOwnership(userId, groupId) {
  if (!groupId) return
  const group = await Group.findOne({ _id: groupId, userId })
  if (!group) {
    throw new ApiError(403, 'INVALID_GROUP', 'That group does not belong to you.')
  }
}

// Same idea for gear: every referenced GearItem must belong to this user.
// Checks the count matches rather than fetching each one individually.
export async function assertGearOwnership(userId, gearItemIds) {
  if (!gearItemIds || gearItemIds.length === 0) return
  const ownedCount = await GearItem.countDocuments({ _id: { $in: gearItemIds }, userId })
  if (ownedCount !== gearItemIds.length) {
    throw new ApiError(403, 'INVALID_GEAR', 'One or more gear items do not belong to you.')
  }
}

// Full ownership check, now that the Destination model exists (Phase 7).
// Previously this only validated ObjectId *format* — see git history / prior
// PROGRESS.md entries for Phases 3 and 5, where this was flagged as a
// deliberate, temporary gap.
export async function assertDestinationOwnership(userId, destinationId) {
  if (!destinationId) return
  const destination = await Destination.findOne({ _id: destinationId, userId })
  if (!destination) {
    throw new ApiError(403, 'INVALID_DESTINATION', 'That destination does not belong to you.')
  }
}
