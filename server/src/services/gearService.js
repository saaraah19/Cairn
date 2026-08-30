import { GearItem } from '../models/GearItem.js'
import { Activity } from '../models/Activity.js'
import { getCloudinary } from '../config/cloudinary.js'
import { ApiError } from '../utils/apiResponse.js'
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js'

export async function createGear(userId, data) {
  return GearItem.create({ ...data, userId })
}

export async function listGear(userId, query) {
  const { page, limit, search, category } = query

  const filter = { userId }
  if (category) filter.category = category
  if (search) filter.$text = { $search: search }

  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    GearItem.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    GearItem.countDocuments(filter),
  ])

  return {
    items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  }
}

// Always 404s rather than leaking existence to other users, matching the
// same pattern as getOwnedActivity (docs/02_TECHNICAL_ARCHITECTURE.md §9).
export async function getOwnedGear(userId, gearId) {
  const gear = await GearItem.findOne({ _id: gearId, userId })
  if (!gear) {
    throw new ApiError(404, 'NOT_FOUND', 'Gear item not found.')
  }
  return gear
}

export async function updateGear(userId, gearId, data) {
  const gear = await getOwnedGear(userId, gearId)
  Object.assign(gear, data)
  await gear.save()
  return gear
}

export async function deleteGear(userId, gearId) {
  const gear = await getOwnedGear(userId, gearId)

  const cloudinary = getCloudinary()
  if (cloudinary && gear.photo?.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(gear.photo.cloudinaryPublicId).catch(() => {})
  }

  await gear.deleteOne()

  // Deleting a GearItem must not delete Activities (docs/05_DATA_MODEL_AND_API_CONTRACT.md
  // §33 only specifies the reverse), but leaving a dangling gearItemIds
  // reference would let an activity point at gear that no longer exists.
  // Pull it from every activity that referenced it.
  await Activity.updateMany({ userId, gearItemIds: gearId }, { $pull: { gearItemIds: gearId } })
}

// Usage history is derived from Activity.gearItemIds, never stored on the
// GearItem itself (docs/05_DATA_MODEL_AND_API_CONTRACT.md §33).
export async function getGearUsage(userId, gearId) {
  await getOwnedGear(userId, gearId) // ownership check
  return Activity.find({ userId, gearItemIds: gearId })
    .sort({ date: -1 })
    .select('activityNumber name date type')
}

// Single-photo semantics (unlike the Activity photo gallery): uploading a
// new photo replaces any existing one, cleaning up the old Cloudinary asset.
export async function uploadGearPhoto(userId, gearId, file) {
  const cloudinary = getCloudinary()
  if (!cloudinary) {
    throw new ApiError(
      501,
      'PHOTOS_NOT_CONFIGURED',
      'Photo uploads are not configured on this server.'
    )
  }

  const gear = await getOwnedGear(userId, gearId)

  if (gear.photo?.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(gear.photo.cloudinaryPublicId).catch(() => {})
  }

  const result = await uploadBufferToCloudinary(cloudinary, file.buffer, `cairn/${userId}/gear`)

  gear.photo = { cloudinaryPublicId: result.public_id, secureUrl: result.secure_url }
  await gear.save()
  return gear
}

export async function removeGearPhoto(userId, gearId) {
  const gear = await getOwnedGear(userId, gearId)

  const cloudinary = getCloudinary()
  if (cloudinary && gear.photo?.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(gear.photo.cloudinaryPublicId).catch(() => {})
  }

  gear.photo = { cloudinaryPublicId: null, secureUrl: null }
  await gear.save()
  return gear
}
