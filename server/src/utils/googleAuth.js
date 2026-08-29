import { OAuth2Client } from 'google-auth-library'
import { env } from '../config/env.js'
import { ApiError } from './apiResponse.js'

let client = null

function getClient() {
  if (!env.googleClientId) {
    throw new ApiError(
      501,
      'GOOGLE_AUTH_NOT_CONFIGURED',
      'Google sign-in is not configured on this server.'
    )
  }
  client ??= new OAuth2Client(env.googleClientId)
  return client
}

// Verifies a Google Identity Services ID token and returns the trusted
// profile fields we care about. Throws ApiError on any invalid/expired/
// wrong-audience token rather than trusting anything the client claims.
export async function verifyGoogleIdToken(idToken) {
  const oAuth2Client = getClient()

  let ticket
  try {
    ticket = await oAuth2Client.verifyIdToken({
      idToken,
      audience: env.googleClientId,
    })
  } catch {
    throw new ApiError(401, 'INVALID_GOOGLE_TOKEN', 'Could not verify Google sign-in.')
  }

  const payload = ticket.getPayload()

  if (!payload?.email_verified) {
    throw new ApiError(401, 'GOOGLE_EMAIL_NOT_VERIFIED', 'Your Google email is not verified.')
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  }
}
