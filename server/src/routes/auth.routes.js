import { Router } from 'express'
import { register, login, google, logout, refresh, me, forgotPassword, resetPasswordHandler } from '../controllers/authController.js'
import { validateBody } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import { authRateLimiter } from '../middleware/rateLimit.js'
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/authValidators.js'

const router = Router()

// Rate-limited: register/login/google are exactly the credential-guessing
// and account-spam surface docs/08_COMMUNITY_PROPOSAL.md §14 calls out —
// pre-existed as a known V1 gap ("Must Fix" in 07_POST_V1_ROADMAP.md),
// closed here. /logout, /refresh, and /me are NOT limited — they require
// an existing valid session already (a cookie an attacker doesn't have),
// so they aren't a meaningful guessing/abuse surface the same way.
router.post('/register', authRateLimiter, validateBody(registerSchema), register)
router.post('/login', authRateLimiter, validateBody(loginSchema), login)
router.post('/google', authRateLimiter, google)
router.post('/logout', logout)
router.post('/refresh', refresh)
router.get('/me', authenticate, me)

// forgot-password/reset-password are rate-limited too — same class of
// abuse surface as register/login (spamming reset emails, or brute-
// forcing a reset token, though the token itself is 32 random bytes and
// not practically guessable within any rate limit).
router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), forgotPassword)
router.post('/reset-password', authRateLimiter, validateBody(resetPasswordSchema), resetPasswordHandler)

export default router
