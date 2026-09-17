import { GearItem } from '../models/GearItem.js'
import { Activity } from '../models/Activity.js'
import { getCloudinary } from '../config/cloudinary.js'
import { ApiError } from '../utils/apiResponse.js'
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js'
import { escapeRegex, buildSearchFilter } from '../utils/searchUtils.js'

export async function createGear(userId, data) {
  return GearItem.create({ ...data, userId })
}

export async function listGear(userId, query) {
  const { page, limit, search, category, store } = query

  const filter = { userId }
  if (category) filter.category = category
  // Case-insensitive EXACT match (not substring, unlike search above) —
  // this powers "filter by store", where picking "Decathlon" from the
  // list listGearStores() returns shouldn't also surface a hypothetical
  // "Decathlon Outlet" as if it were the same store.
  if (store) filter.store = new RegExp(`^${escapeRegex(store)}$`, 'i')
  // Substring match, consistent with Activity/Destination/Community
  // search — see searchUtils.js for why this replaced $text.
  const searchFilter = buildSearchFilter(search, ['name', 'brand', 'model', 'notes'])
  if (searchFilter) Object.assign(filter, searchFilter)

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

// Product-owner request, 2026-09-14 (07_POST_V1_ROADMAP.md §C): "know
// easily where I buy my equipment and how much I've spent at each
// store." Grouped in application code (fetch + reduce), matching this
// codebase's existing convention for every other statistic
// (statisticsService.js, communityStatisticsService.js) rather than
// introducing this project's first MongoDB aggregation pipeline for what
// is, at personal-gear-closet scale, a trivially small dataset. Grouped
// case-INsensitively (so "Decathlon" and "decathlon" count as the same
// store, not two) — the DISPLAYED name is whichever casing was seen
// first, which is an accepted simplification, not an attempt at
// "most common casing" analysis.
export async function listGearStores(userId) {
  const items = await GearItem.find({ userId, store: { $ne: '' } }).select('store purchasePriceDzd')

  const byStore = new Map()
  for (const item of items) {
    const trimmed = item.store.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    const entry = byStore.get(key) ?? { store: trimmed, itemCount: 0, totalSpentDzd: 0 }
    entry.itemCount += 1
    entry.totalSpentDzd += item.purchasePriceDzd ?? 0
    byStore.set(key, entry)
  }

  return [...byStore.values()].sort((a, b) => a.store.localeCompare(b.store))
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
