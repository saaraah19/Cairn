import { Router } from 'express'
import { remove } from '../controllers/photoController.js'
import { authenticate } from '../middleware/authenticate.js'

const router = Router()
router.use(authenticate)

router.delete('/:photoId', remove)

export default router
