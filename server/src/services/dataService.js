import bcrypt from 'bcrypt'
import { User } from '../models/User.js'
import { Activity } from '../models/Activity.js'
import { Photo } from '../models/Photo.js'
import { GearItem } from '../models/GearItem.js'
import { PlannedActivity } from '../models/PlannedActivity.js'
import { Destination } from '../models/Destination.js'
import { Group } from '../models/Group.js'
import { Companion } from '../models/Companion.js'
import { Counter } from '../models/Counter.js'
import { getCloudinary } from '../config/cloudinary.js'
import { ApiError } from '../utils/apiResponse.js'

// docs/02_TECHNICAL_ARCHITECTURE.md §42: "A first V1 implementation can use
// JSON... images do not necessarily need to be bundled into the initial
// export." Image binaries stay in Cloudinary; the export includes their
// secureUrls so nothing is lost, without trying to bundle actual files.
export async function exportUserData(userId) {
  const [user, activities, plannedActivities, destinations, gear, groups, companions] =
    await Promise.all([
      User.findById(userId),
      Activity.find({ userId }),
      PlannedActivity.find({ userId }),
      Destination.find({ userId }),
      GearItem.find({ userId }),
      Group.find({ userId }),
      Companion.find({ userId }),
    ])

  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.')
  }

  return {
    exportedAt: new Date().toISOString(),
    profile: user, // toJSON transform already strips passwordHash
    activities,
    plannedActivities,
    destinations,
    gear,
    groups,
    companions,
  }
}

// docs/02_TECHNICAL_ARCHITECTURE.md §41: identifies every user-owned
// resource, removes it, and addresses Cloudinary media. Protected by
// explicit confirmation at the controller/validator level before this ever
// runs.
export async function deleteAccount(userId, currentPassword) {
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.')
  }

  // Extra confirmation layer for accounts that have a password — mirrors
  // the same pattern as profileService.changePassword. Google-only accounts
  // have nothing to check here; the "type DELETE" confirmation (enforced
  // by the validator) is their equivalent safeguard.
  if (user.passwordHash) {
    if (!currentPassword) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Enter your current password to confirm.')
    }
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isMatch) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect.')
    }
  }

  const cloudinary = getCloudinary()

  // Gather every Cloudinary asset this user owns before deleting the
  // records that reference them.
  const [photos, gearItems, destinations] = await Promise.all([
    Photo.find({ userId }).select('cloudinaryPublicId'),
    GearItem.find({ userId }).select('photo'),
    Destination.find({ userId }).select('coverImage'),
  ])

  const publicIds = [
    ...photos.map((p) => p.cloudinaryPublicId),
    ...gearItems.map((g) => g.photo?.cloudinaryPublicId),
    ...destinations.map((d) => d.coverImage?.cloudinaryPublicId),
    user.profilePicture?.cloudinaryPublicId,
  ].filter(Boolean)

  if (cloudinary && publicIds.length > 0) {
    await Promise.all(publicIds.map((id) => cloudinary.uploader.destroy(id).catch(() => {})))
  }

  // Remove every user-owned document across every collection.
  await Promise.all([
    Activity.deleteMany({ userId }),
    Photo.deleteMany({ userId }),
    GearItem.deleteMany({ userId }),
    PlannedActivity.deleteMany({ userId }),
    Destination.deleteMany({ userId }),
    Group.deleteMany({ userId }),
    Companion.deleteMany({ userId }),
    Counter.deleteMany({ userId }),
  ])

  await user.deleteOne()
}
