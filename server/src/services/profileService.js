import bcrypt from 'bcrypt'
import { User } from '../models/User.js'
import { getCloudinary } from '../config/cloudinary.js'
import { ApiError } from '../utils/apiResponse.js'
import { uploadBufferToCloudinary } from '../utils/cloudinaryUpload.js'

const SALT_ROUNDS = 12

export async function getProfile(userId) {
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.')
  }
  return user
}

export async function updateProfile(userId, data) {
  const user = await getProfile(userId)

  if (data.username && data.username !== user.username) {
    const existing = await User.findOne({ username: data.username })
    if (existing) {
      throw new ApiError(409, 'USERNAME_TAKEN', 'This username is already taken.')
    }
  }

  if (data.name !== undefined) user.name = data.name
  if (data.username !== undefined) user.username = data.username
  if (data.bio !== undefined) user.bio = data.bio
  if (data.location !== undefined) user.location = data.location
  if (data.preferences) {
    user.preferences = { ...user.preferences.toObject(), ...data.preferences }
  }

  await user.save()
  return user
}

// Handles both "change" (account already has a password — must confirm the
// current one) and "set" (Google-only account adding a password for the
// first time — nothing to confirm since none exists yet).
export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await getProfile(userId)

  if (user.passwordHash) {
    if (!currentPassword) {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Enter your current password.')
    }
    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isMatch) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Current password is incorrect.')
    }
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
  if (!user.authProviders.includes('password')) {
    user.authProviders.push('password')
  }
  await user.save()
  return user
}

export async function uploadProfilePicture(userId, file) {
  const cloudinary = getCloudinary()
  if (!cloudinary) {
    throw new ApiError(
      501,
      'PHOTOS_NOT_CONFIGURED',
      'Photo uploads are not configured on this server.'
    )
  }

  const user = await getProfile(userId)

  if (user.profilePicture?.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(user.profilePicture.cloudinaryPublicId).catch(() => {})
  }

  const result = await uploadBufferToCloudinary(cloudinary, file.buffer, `cairn/${userId}/profile`)

  user.profilePicture = { cloudinaryPublicId: result.public_id, secureUrl: result.secure_url }
  await user.save()
  return user
}

export async function removeProfilePicture(userId) {
  const user = await getProfile(userId)

  const cloudinary = getCloudinary()
  if (cloudinary && user.profilePicture?.cloudinaryPublicId) {
    await cloudinary.uploader.destroy(user.profilePicture.cloudinaryPublicId).catch(() => {})
  }

  user.profilePicture = { cloudinaryPublicId: null, secureUrl: null }
  await user.save()
  return user
}
