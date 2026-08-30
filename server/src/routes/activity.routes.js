import { Router } from 'express'
import { create, list, getById, update, remove } from '../controllers/activityController.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  createActivitySchema,
  updateActivitySchema,
  listActivitiesQuerySchema,
} from '../validators/activityValidators.js'

const router = Router()

// Every route in this file requires authentication.
router.use(authenticate)

router.get('/', validateQuery(listActivitiesQuerySchema), list)
router.post('/', validateBody(createActivitySchema), create)
router.get('/:id', getById)
router.patch('/:id', validateBody(updateActivitySchema), update)
router.delete('/:id', remove)

export default router
