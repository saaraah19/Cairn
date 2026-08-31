import { Router } from 'express'
import { create, list, getById, update, remove, complete } from '../controllers/plannedActivityController.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  createPlannedActivitySchema,
  updatePlannedActivitySchema,
  listPlannedActivitiesQuerySchema,
  completePlannedActivitySchema,
} from '../validators/plannedActivityValidators.js'

const router = Router()
router.use(authenticate)

router.get('/', validateQuery(listPlannedActivitiesQuerySchema), list)
router.post('/', validateBody(createPlannedActivitySchema), create)
router.get('/:id', getById)
router.patch('/:id', validateBody(updatePlannedActivitySchema), update)
router.delete('/:id', remove)
router.post('/:id/complete', validateBody(completePlannedActivitySchema), complete)

export default router
