import { PlannedActivity } from '../models/PlannedActivity.js'
import { Activity } from '../models/Activity.js'
import { ApiError } from '../utils/apiResponse.js'
import { assertGroupOwnership, assertGearOwnership, assertDestinationOwnership } from '../utils/ownershipChecks.js'

export async function createPlannedActivity(userId, data) {
  await assertGroupOwnership(userId, data.social?.groupId)
  await assertGearOwnership(userId, data.packedGearItemIds)
  await assertDestinationOwnership(data.destinationId)

  return PlannedActivity.create({ ...data, userId })
}

export async function listPlannedActivities(userId, query) {
  const { page, limit, status } = query

  const filter = { userId }
  if (status) filter.status = status

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    PlannedActivity.find(filter)
      .sort({ plannedDate: 1 })
      .skip(skip)
      .limit(limit)
      .populate('social.groupId', 'name'),
    PlannedActivity.countDocuments(filter),
  ])

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  }
}

// Always 404s rather than leaking existence to other users, matching the
// same pattern as getOwnedActivity/getOwnedGear.
export async function getOwnedPlannedActivity(userId, plannedActivityId) {
  const plan = await PlannedActivity.findOne({ _id: plannedActivityId, userId })
    .populate('social.groupId', 'name')
    .populate('completedActivityId', 'activityNumber name date')
    .populate('packedGearItemIds', 'name category weightGrams photo')
    .populate('destinationId', 'name')
  if (!plan) {
    throw new ApiError(404, 'NOT_FOUND', 'Planned activity not found.')
  }
  return plan
}

export async function updatePlannedActivity(userId, plannedActivityId, data) {
  const plan = await getOwnedPlannedActivity(userId, plannedActivityId)

  if (data.social?.groupId !== undefined) {
    await assertGroupOwnership(userId, data.social.groupId)
  }
  if (data.packedGearItemIds !== undefined) {
    await assertGearOwnership(userId, data.packedGearItemIds)
  }
  if (data.destinationId !== undefined) {
    await assertDestinationOwnership(data.destinationId)
  }

  for (const [key, value] of Object.entries(data)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      plan[key] &&
      typeof plan[key].toObject === 'function'
    ) {
      plan[key] = { ...plan[key].toObject(), ...value }
    } else {
      plan[key] = value
    }
  }

  await plan.save()
  return plan
}

export async function deletePlannedActivity(userId, plannedActivityId) {
  const plan = await getOwnedPlannedActivity(userId, plannedActivityId)
  await plan.deleteOne()
  // Does not touch the linked Activity if one exists — the completed
  // activity is a permanent historical record independent of the plan
  // (docs/02_TECHNICAL_ARCHITECTURE.md §17).
}

// Links an already-created Activity to this plan and marks it completed.
// The plan document itself is preserved, not overwritten — it remains
// available as historical planning context (docs/05_DATA_MODEL_AND_API_CONTRACT.md §25).
export async function completePlannedActivity(userId, plannedActivityId, activityId) {
  const plan = await getOwnedPlannedActivity(userId, plannedActivityId)

  // Verify the activity being linked actually belongs to this user too —
  // never trust a client-supplied ID pairing.
  const activity = await Activity.findOne({ _id: activityId, userId })
  if (!activity) {
    throw new ApiError(403, 'INVALID_ACTIVITY', 'That activity does not belong to you.')
  }

  plan.completedActivityId = activity._id
  plan.status = 'completed'
  await plan.save()
  return plan
}
