import {
  registerUser,
  authenticateUser,
  authenticateOrCreateGoogleUser,
  getUserById,
} from '../services/authService.js'
import { success, ApiError } from '../utils/apiResponse.js'
import { verifyGoogleIdToken } from '../utils/googleAuth.js'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  accessCookieOptions,
  refreshCookieOptions,
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
} from '../utils/tokens.js'

function setAuthCookies(res, userId) {
  res.cookie(ACCESS_COOKIE_NAME, signAccessToken(userId), accessCookieOptions())
  res.cookie(REFRESH_COOKIE_NAME, signRefreshToken(userId), refreshCookieOptions())
}

function clearAuthCookies(res) {
  res.clearCookie(ACCESS_COOKIE_NAME, accessCookieOptions())
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions())
}

export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body)
    setAuthCookies(res, user._id.toString())
    success(res, { user }, 201)
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const user = await authenticateUser(req.body)
    setAuthCookies(res, user._id.toString())
    success(res, { user })
  } catch (err) {
    next(err)
  }
}

export async function google(req, res, next) {
  try {
    const { credential } = req.body

    if (!credential || typeof credential !== 'string') {
      throw new ApiError(422, 'VALIDATION_ERROR', 'Missing Google credential.')
    }

    const profile = await verifyGoogleIdToken(credential)
    const user = await authenticateOrCreateGoogleUser(profile)
    setAuthCookies(res, user._id.toString())
    success(res, { user })
  } catch (err) {
    next(err)
  }
}

export async function logout(req, res) {
  clearAuthCookies(res)
  success(res, { loggedOut: true })
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME]
    if (!token) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'You must be logged in to do that.')
    }

    let payload
    try {
      payload = verifyRefreshToken(token)
    } catch {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Your session has expired. Please log in again.')
    }

    // Confirm the user still exists before issuing a new access token.
    await getUserById(payload.sub)

    res.cookie(ACCESS_COOKIE_NAME, signAccessToken(payload.sub), accessCookieOptions())
    success(res, { refreshed: true })
  } catch (err) {
    next(err)
  }
}

export async function me(req, res, next) {
  try {
    const user = await getUserById(req.userId)
    success(res, { user })
  } catch (err) {
    next(err)
  }
}
