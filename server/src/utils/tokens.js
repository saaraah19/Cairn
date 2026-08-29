import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL = '7d'
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function signAccessToken(userId) {
  return jwt.sign({ sub: userId, type: 'access' }, env.jwtAccessSecret, {
    expiresIn: ACCESS_TOKEN_TTL,
  })
}

export function signRefreshToken(userId) {
  return jwt.sign({ sub: userId, type: 'refresh' }, env.jwtRefreshSecret, {
    expiresIn: REFRESH_TOKEN_TTL,
  })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwtRefreshSecret)
}

// Shared cookie options. httpOnly + sameSite=lax prevent the token from being
// read by JS or sent cross-site; secure is enabled outside local dev.
// See docs/02_TECHNICAL_ARCHITECTURE.md §8.
const baseCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.nodeEnv === 'production',
}

export const ACCESS_COOKIE_NAME = 'cairn_access_token'
export const REFRESH_COOKIE_NAME = 'cairn_refresh_token'

export function accessCookieOptions() {
  return { ...baseCookieOptions, maxAge: 15 * 60 * 1000 }
}

export function refreshCookieOptions() {
  return { ...baseCookieOptions, maxAge: REFRESH_TOKEN_TTL_MS, path: '/api/auth' }
}
