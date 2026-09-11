import { verifyAccessToken, ACCESS_COOKIE_NAME } from '../utils/tokens.js'

// Community read endpoints (public feed, public activity, public profile)
// must work for logged-out visitors, but also need to know who's asking
// when someone *is* logged in (e.g. "have I already kudos'd this?"). Unlike
// authenticate.js, this never rejects the request — it attaches req.userId
// when a valid session exists and simply leaves it undefined otherwise.
//
// Deliberately does not attempt a silent refresh on an expired access token
// (unlike the client's apiClient.js) — an expired token on an optional-auth
// route just means "treat this as a logged-out request," which is a safe,
// correct fallback, not an error.
export function optionalAuthenticate(req, _res, next) {
  const token = req.cookies?.[ACCESS_COOKIE_NAME]

  if (!token) {
    return next()
  }

  try {
    const payload = verifyAccessToken(token)
    req.userId = payload.sub
  } catch {
    // Invalid/expired token on an optional-auth route — proceed as anonymous.
  }

  next()
}
