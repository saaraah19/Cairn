import { Router } from 'express'
import { get } from '../controllers/statisticsController.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()
router.use(authenticate)

router.get('/', get)

export default router
