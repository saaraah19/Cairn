import { Router } from 'express'
import { list, create, remove } from '../controllers/companionController.js'
import { validateBody } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import { createNameSchema } from '../validators/nameValidators.js'

const router = Router()
router.use(authenticate)

router.get('/', list)
router.post('/', validateBody(createNameSchema), create)
router.delete('/:id', remove)

export default router
