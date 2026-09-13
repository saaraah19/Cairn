import { Router } from 'express'
import { register, login, google, logout, refresh, me } from '../controllers/authController.js'
import { validateBody } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import { authRateLimiter } from '../middleware/rateLimit.js'
import { registerSchema, loginSchema } from '../validators/authValidators.js'

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

export default router
