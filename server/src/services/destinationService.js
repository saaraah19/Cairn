import { Destination } from '../models/Destination.js'
import { Activity } from '../models/Activity.js'
import { PlannedActivity } from '../models/PlannedActivity.js'
import { getCloudinary } from '../config/cloudinary.js'
import { ApiError } from '../utils/apiResponse.js'
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js'

export async function createDestination(userId, data) {
  return Destination.create({ ...data, userId })
}

export async function listDestinations(userId, query) {
  const { page, limit, search, status } = query

  const filter = { userId }
  if (status) filter.status = status
  if (search) filter.$text = { $search: search }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Destination.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Destination.countDocuments(filter),
  ])

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  }
}

// Always 404s rather than leaking existence to other users, matching the
// same pattern as every other owned-resource lookup in the app.
export async function getOwnedDestination(userId, destinationId) {
  const destination = await Destination.findOne({ _id: destinationId, userId })
  if (!destination) {
    throw new ApiError(404, 'NOT_FOUND', 'Destination not found.')
  }
  return destination
}

export async function updateDestination(userId, destinationId, data) {
  const destination = await getOwnedDestination(userId, destinationId)

  for (const [key, value] of Object.entries(data)) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      destination[key] &&
      typeof destination[key].toObject === 'function'
    ) {
      destination[key] = { ...destination[key].toObject(), ...value }
    } else {
      destination[key] = value
    }
  }

  await destination.save()
  return destination
}

export async function deleteDestination(userId, destinationId) {
  const destination = await getOwnedDestination(userId, destinationId)

  const cloudinary = getCloudinary()
  if (cloudinary && destination.coverImage?.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(destination.coverImage.cloudinaryPublicId).catch(() => {})
  }

  await destination.deleteOne()

  // Activities/PlannedActivities that reference this destination keep their
  // destinationId pointing at a now-deleted document. Unlike gear (Phase 4),
  // we deliberately do NOT $pull/clear this reference: a past activity's
  // record of "I went to X" remains meaningful even if the saved Destination
  // is later removed — docs/05_DATA_MODEL_AND_API_CONTRACT.md doesn't specify
  // either way, so this is a judgment call, flagged in PROGRESS.md.
}

export async function uploadDestinationCoverImage(userId, destinationId, file) {
  const cloudinary = getCloudinary()
  if (!cloudinary) {
    throw new ApiError(
      501,
      'PHOTOS_NOT_CONFIGURED',
      'Photo uploads are not configured on this server.'
    )
  }

  const destination = await getOwnedDestination(userId, destinationId)

  if (destination.coverImage?.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(destination.coverImage.cloudinaryPublicId).catch(() => {})
  }

  const result = await uploadBufferToCloudinary(
    cloudinary,
    file.buffer,
    `cairn/${userId}/destinations`
  )

  destination.coverImage = { cloudinaryPublicId: result.public_id, secureUrl: result.secure_url }
  await destination.save()
  return destination
}

export async function removeDestinationCoverImage(userId, destinationId) {
  const destination = await getOwnedDestination(userId, destinationId)

  const cloudinary = getCloudinary()
  if (cloudinary && destination.coverImage?.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(destination.coverImage.cloudinaryPublicId).catch(() => {})
  }

  destination.coverImage = { cloudinaryPublicId: null, secureUrl: null }
  await destination.save()
  return destination
}

// Derived, never stored — mirrors the gear-usage-history pattern from Phase 4.
export async function getDestinationRelated(userId, destinationId) {
  await getOwnedDestination(userId, destinationId) // ownership check

  const [activities, plannedActivities] = await Promise.all([
    Activity.find({ userId, destinationId }).sort({ date: -1 }).select('activityNumber name date type'),
    PlannedActivity.find({ userId, destinationId })
      .sort({ plannedDate: -1 })
      .select('name plannedDate type status'),
  ])

  return { activities, plannedActivities }
}
