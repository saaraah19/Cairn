import { ApiError } from '../utils/apiResponse.js'
import { verifyAccessToken, ACCESS_COOKIE_NAME } from '../utils/tokens.js'

// Attaches req.userId from a valid access-token cookie. Every protected
// route relies on this rather than trusting any client-supplied identity
// (docs/02_TECHNICAL_ARCHITECTURE.md §9).
export function authenticate(req, res, next) {
  const token = req.cookies?.[ACCESS_COOKIE_NAME]

  if (!token) {
    return next(new ApiError(401, 'UNAUTHENTICATED', 'You must be logged in to do that.'))
  }

  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.sub
    next()
  } catch {
    next(new ApiError(401, 'UNAUTHENTICATED', 'Your session has expired. Please log in again.'))
  }
}
