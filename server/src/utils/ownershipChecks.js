import { Group } from '../models/Group.js'
import { GearItem } from '../models/GearItem.js'
import { ApiError } from './apiResponse.js'

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i

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

// destinationId ownership cannot be verified yet — the Destination model
// doesn't exist until Phase 7. Format is validated so the field can't be
// used to store garbage; full ownership check is a TODO for Phase 7.
export function assertDestinationIdFormat(destinationId) {
  if (destinationId && !OBJECT_ID_PATTERN.test(destinationId)) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'Invalid destination reference.')
  }
}
