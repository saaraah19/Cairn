import { Router } from 'express'
import { register, login, google, logout, refresh, me } from '../controllers/authController.js'
import { validateBody } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import { registerSchema, loginSchema } from '../validators/authValidators.js'

const router = Router()

router.post('/register', validateBody(registerSchema), register)
router.post('/login', validateBody(loginSchema), login)
router.post('/google', google)
router.post('/logout', logout)
router.post('/refresh', refresh)
router.get('/me', authenticate, me)

export default router
