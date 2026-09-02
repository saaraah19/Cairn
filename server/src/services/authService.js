import bcrypt from 'bcrypt'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiResponse.js'
import { generateUniqueUsername } from '../utils/generateUsername.js'

const SALT_ROUNDS = 12

export async function registerUser({ name, email, username, password }) {
  const existingEmail = await User.findOne({ email })
  if (existingEmail) {
    throw new ApiError(409, 'EMAIL_TAKEN', 'An account with this email already exists.')
  }

  const existingUsername = await User.findOne({ username })
  if (existingUsername) {
    throw new ApiError(409, 'USERNAME_TAKEN', 'This username is already taken.')
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

  const user = await User.create({
    name,
    email,
    username,
    passwordHash,
    authProviders: ['password'],
  })

  return user
}

export async function authenticateUser({ email, password }) {
  const user = await User.findOne({ email })
  if (!user) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.')
  }

  if (!user.passwordHash) {
    throw new ApiError(
      401,
      'NO_PASSWORD_SET',
      'This account signs in with Google. Use "Sign in with Google" instead.'
    )
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash)
  if (!isMatch) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Incorrect email or password.')
  }

  return user
}

// Handles Google sign-in for both new and existing users. If an account
// with this googleId already exists, logs it in. Otherwise, if an account
// with this email already exists (e.g. originally registered with a
// password), links Google to it rather than creating a duplicate account
// (docs/02_TECHNICAL_ARCHITECTURE.md §7). Otherwise creates a new account
// with an auto-generated username (docs/PROGRESS.md — Google signup decision).
export async function authenticateOrCreateGoogleUser({ googleId, email, name, picture }) {
  const existingByGoogleId = await User.findOne({ googleId })
  if (existingByGoogleId) {
    return existingByGoogleId
  }

  const existingByEmail = await User.findOne({ email })
  if (existingByEmail) {
    existingByEmail.googleId = googleId
    if (!existingByEmail.authProviders.includes('google')) {
      existingByEmail.authProviders.push('google')
    }
    if (!existingByEmail.profilePicture?.secureUrl && picture) {
      // No cloudinaryPublicId — this is Google's own hosted image URL, not
      // something we uploaded ourselves, so there's nothing for us to
      // manage/delete in Cloudinary later.
      existingByEmail.profilePicture = { cloudinaryPublicId: null, secureUrl: picture }
    }
    await existingByEmail.save()
    return existingByEmail
  }

  const username = await generateUniqueUsername(email)

  const user = await User.create({
    name: name || email.split('@')[0],
    email,
    username,
    googleId,
    profilePicture: picture ? { cloudinaryPublicId: null, secureUrl: picture } : undefined,
    authProviders: ['google'],
  })

  return user
}

export async function getUserById(userId) {
  const user = await User.findById(userId)
  if (!user) {
    throw new ApiError(404, 'USER_NOT_FOUND', 'User not found.')
  }
  return user
}
