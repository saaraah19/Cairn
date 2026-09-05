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

// Shared cookie options. httpOnly prevents the token from being read by JS.
// SameSite/secure depend on deployment topology: in local dev, frontend and
// backend share "localhost" as their site (different ports don't matter for
// SameSite purposes), so Lax works and doesn't require HTTPS. In production,
// frontend and backend are commonly deployed as separate services on
// different subdomains (e.g. Render's *.onrender.com is on the public
// suffix list, making two Render services cross-site from each other) — Lax
// cookies are silently dropped on cross-site fetch requests there. None+
// Secure works correctly whether the deployment ends up same-origin or
// cross-origin, and Secure is safe to require since production is always
// HTTPS. See docs/02_TECHNICAL_ARCHITECTURE.md §8.
const isProduction = env.nodeEnv === 'production'
const baseCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
}

export const ACCESS_COOKIE_NAME = 'cairn_access_token'
export const REFRESH_COOKIE_NAME = 'cairn_refresh_token'

export function accessCookieOptions() {
  return { ...baseCookieOptions, maxAge: 15 * 60 * 1000 }
}

export function refreshCookieOptions() {
  return { ...baseCookieOptions, maxAge: REFRESH_TOKEN_TTL_MS, path: '/api/auth' }
}
