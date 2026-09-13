import { rateLimit, ipKeyGenerator } from 'express-rate-limit'

// Per docs/08_COMMUNITY_PROPOSAL.md §14 — an explicit, non-negotiable
// pre-launch dependency, not a speculative addition. Two presets:
//
// `authRateLimiter` — strict, keyed by IP. These are pre-authentication
// endpoints (register/login/google) where the whole point is guessing
// credentials or spamming account creation, so there's no `req.userId`
// yet to key on; IP is the only signal available.
//
// `communityWriteRateLimiter` — looser, keyed by the AUTHENTICATED USER
// when available (every route this is applied to already sits behind
// `authenticate`), falling back to IP only for the rare case it doesn't.
// User-keying is deliberately more accurate than IP-keying here: it
// doesn't punish everyone behind a shared/campus/corporate IP for one
// abusive account, and it can't be evaded by an abusive account simply
// switching networks.
//
// Requires `app.set('trust proxy', ...)` in app.js — without it, every
// request behind Render's reverse proxy would appear to share the
// platform's single proxy IP, making IP-based limiting meaningless in
// production (this was previously missing entirely; fixed alongside this
// middleware, see app.js).

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts. Please try again later.' } },
})

export const communityWriteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  // ipKeyGenerator (not raw req.ip) correctly normalizes IPv6 addresses to
  // a /64 block — using the raw string would let an IPv6 client trivially
  // evade the limit by varying the host portion of their own address.
  keyGenerator: (req) => req.userId ?? ipKeyGenerator(req.ip),
  message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please slow down.' } },
})
