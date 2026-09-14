import bcrypt from 'bcrypt'
import crypto from 'node:crypto'
import { User } from '../models/User.js'
import { ApiError } from '../utils/apiResponse.js'
import { generateUniqueUsername } from '../utils/generateUsername.js'
import { mailService } from './mailService.js'
import { env } from '../config/env.js'

const SALT_ROUNDS = 12
const RESET_TOKEN_BYTES = 32
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000 // 30 minutes

function hashResetToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

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

// Deliberately never reveals whether the email exists, whether it belongs
// to a Google-only account, or anything else — the controller always
// returns the same generic message regardless of what happens in here.
// This function's return value is intentionally unused by the controller;
// it exists only so tests can observe what actually happened without
// weakening the controller's own response.
export async function requestPasswordReset(email) {
  const user = await User.findOne({ email })

  // No account, or a Google-only account with no password to reset —
  // both cases produce no visible difference to the caller. Emailing a
  // Google-only account a "reset your password" link would be actively
  // confusing (they have no password), so this simply does nothing for
  // that case rather than sending a misleading email.
  if (!user || !user.passwordHash) {
    return { sent: false }
  }

  const rawToken = crypto.randomBytes(RESET_TOKEN_BYTES).toString('hex')
  user.passwordResetTokenHash = hashResetToken(rawToken)
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS)
  await user.save()

  const resetUrl = `${env.clientUrls[0]}/reset-password?token=${rawToken}`
  await mailService.sendPasswordResetEmail(user.email, resetUrl)

  return { sent: true }
}

export async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashResetToken(rawToken)
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  })

  if (!user) {
    throw new ApiError(400, 'INVALID_OR_EXPIRED_TOKEN', 'This reset link is invalid or has expired.')
  }

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
  // Single-use: cleared immediately so the same link can never be reused,
  // and so a second reset request's link doesn't get silently
  // invalidated by reusing a stale one (there's only ever one valid link
  // per user — the most recently requested one — but clearing it here
  // rather than relying solely on expiry keeps that invariant exact).
  user.passwordResetTokenHash = null
  user.passwordResetExpiresAt = null
  await user.save()
}
