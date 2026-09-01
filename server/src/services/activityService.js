import { Activity } from '../models/Activity.js'
import { getNextSequenceValue } from '../models/Counter.js'
import { ApiError } from '../utils/apiResponse.js'
import { deleteAllPhotosForActivity } from './photoService.js'
import { assertGroupOwnership, assertGearOwnership, assertDestinationOwnership } from '../utils/ownershipChecks.js'

export async function createActivity(userId, data) {
  await assertGroupOwnership(userId, data.social?.groupId)
  await assertGearOwnership(userId, data.gearItemIds)
  await assertDestinationOwnership(data.destinationId)

  const activityNumber = await getNextSequenceValue(userId, 'activityNumber')

  return Activity.create({
    ...data,
    userId,
    activityNumber,
  })
}

export async function listActivities(userId, query) {
  const { page, limit, search, type, difficulty, wilaya, groupId, dateFrom, dateTo, sort } = query

  const filter = { userId }
  if (type) filter.type = type
  if (difficulty) filter['trail.difficulty'] = difficulty
  if (wilaya) filter['location.wilaya'] = new RegExp(wilaya, 'i')
  if (groupId) filter['social.groupId'] = groupId
  if (dateFrom || dateTo) {
    filter.date = {}
    if (dateFrom) filter.date.$gte = new Date(dateFrom)
    if (dateTo) filter.date.$lte = new Date(dateTo)
  }
  if (search) filter.$text = { $search: search }

  const sortMap = {
    newest: { date: -1 },
    oldest: { date: 1 },
    distance: { 'trail.distanceKm': -1 },
    rating: { 'review.rating': -1 },
    elevation: { 'trail.elevationGainM': -1 },
  }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Activity.find(filter).sort(sortMap[sort]).skip(skip).limit(limit).populate('coverPhotoId', 'secureUrl'),
    Activity.countDocuments(filter),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  }
}

// Never leaks whether an activity exists for another user — always 404,
// never a distinguishable 403 (docs/02_TECHNICAL_ARCHITECTURE.md §9).
export async function getOwnedActivity(userId, activityId) {
  const activity = await Activity.findOne({ _id: activityId, userId })
    .populate('social.groupId', 'name')
    .populate('coverPhotoId', 'secureUrl')
    .populate('gearItemIds', 'name category photo')
    .populate('destinationId', 'name')
  if (!activity) {
    throw new ApiError(404, 'NOT_FOUND', 'Activity not found.')
  }
  return activity
}

export async function updateActivity(userId, activityId, data) {
  const activity = await getOwnedActivity(userId, activityId)

  if (data.social?.groupId !== undefined) {
    await assertGroupOwnership(userId, data.social.groupId)
  }
  if (data.gearItemIds !== undefined) {
    await assertGearOwnership(userId, data.gearItemIds)
  }
  if (data.destinationId !== undefined) {
    await assertDestinationOwnership(data.destinationId)
  }

  // Deep-merge nested objects rather than overwriting them wholesale, so a
  // partial update (e.g. only `trail.distanceKm`) doesn't wipe out sibling
  // fields the client didn't send.
  for (const [key, value] of Object.entries(data)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      activity[key] &&
      typeof activity[key].toObject === 'function'
    ) {
      activity[key] = { ...activity[key].toObject(), ...value }
    } else {
      activity[key] = value
    }
  }

  await activity.save()
  return activity
}

export async function deleteActivity(userId, activityId) {
  const activity = await getOwnedActivity(userId, activityId)
  await deleteAllPhotosForActivity(activityId)
  await activity.deleteOne()
}
