import { Photo } from '../models/Photo.js'
import { Activity } from '../models/Activity.js'
import { getCloudinary } from '../config/cloudinary.js'
import { ApiError } from '../utils/apiResponse.js'
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js'
import { getOwnedActivity } from './activityService.js'

const MAX_PHOTOS_PER_ACTIVITY = 20

function requireCloudinary() {
  const cloudinary = getCloudinary()
  if (!cloudinary) {
    throw new ApiError(
      501,
      'PHOTOS_NOT_CONFIGURED',
      'Photo uploads are not configured on this server.'
    )
  }
  return cloudinary
}

export async function uploadActivityPhoto(userId, activityId, file) {
  const cloudinary = requireCloudinary()

  // Verifies the activity belongs to this user before anything touches
  // Cloudinary — never let a client attach a photo to someone else's activity.
  const activity = await getOwnedActivity(userId, activityId)

  const existingCount = await Photo.countDocuments({ activityId })
  if (existingCount >= MAX_PHOTOS_PER_ACTIVITY) {
    throw new ApiError(
      422,
      'TOO_MANY_PHOTOS',
      `An activity can have at most ${MAX_PHOTOS_PER_ACTIVITY} photos.`
    )
  }

  const result = await uploadBufferToCloudinary(
    cloudinary,
    file.buffer,
    `cairn/${userId}/activities/${activityId}`
  )

  const isFirstPhoto = existingCount === 0

  const photo = await Photo.create({
    userId,
    activityId,
    cloudinaryPublicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    isCover: isFirstPhoto,
  })

  if (isFirstPhoto) {
    activity.coverPhotoId = photo._id
    await activity.save()
  }

  return photo
}

export async function listActivityPhotos(userId, activityId) {
  await getOwnedActivity(userId, activityId) // ownership check
  return Photo.find({ activityId }).sort({ isCover: -1, createdAt: 1 })
}

async function getOwnedPhoto(userId, photoId) {
  const photo = await Photo.findOne({ _id: photoId, userId })
  if (!photo) {
    throw new ApiError(404, 'NOT_FOUND', 'Photo not found.')
  }
  return photo
}

export async function setCoverPhoto(userId, activityId, photoId) {
  const activity = await getOwnedActivity(userId, activityId)
  const photo = await getOwnedPhoto(userId, photoId)

  if (photo.activityId.toString() !== activityId) {
    throw new ApiError(422, 'VALIDATION_ERROR', 'That photo does not belong to this activity.')
  }

  await Photo.updateMany({ activityId, _id: { $ne: photoId } }, { isCover: false })
  photo.isCover = true
  await photo.save()

  activity.coverPhotoId = photo._id
  await activity.save()

  return photo
}

export async function deleteActivityPhoto(userId, photoId) {
  const cloudinary = requireCloudinary()
  const photo = await getOwnedPhoto(userId, photoId)

  await cloudinary.uploader.destroy(photo.cloudinaryPublicId).catch(() => {
    // If Cloudinary cleanup fails, still remove our record rather than
    // leaving an orphaned reference the user can't get rid of. The orphaned
    // Cloudinary asset can be cleaned up later; it's not a correctness issue
    // for the app itself.
  })

  await photo.deleteOne()

  if (photo.isCover) {
    const nextCover = await Photo.findOne({ activityId: photo.activityId }).sort({ createdAt: 1 })
    const activity = await Activity.findById(photo.activityId)
    if (activity) {
      if (nextCover) {
        nextCover.isCover = true
        await nextCover.save()
        activity.coverPhotoId = nextCover._id
      } else {
        activity.coverPhotoId = null
      }
      await activity.save()
    }
  }
}

// Called from activityService.deleteActivity — cleans up every photo
// belonging to an activity when the activity itself is deleted.
export async function deleteAllPhotosForActivity(activityId) {
  const cloudinary = getCloudinary()
  const photos = await Photo.find({ activityId })

  if (cloudinary) {
    await Promise.all(
      photos.map((p) => cloudinary.uploader.destroy(p.cloudinaryPublicId).catch(() => {}))
    )
  }

  await Photo.deleteMany({ activityId })
}
