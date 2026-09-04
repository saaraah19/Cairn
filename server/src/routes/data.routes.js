import { Router } from 'express'
import { exportData, remove } from '../controllers/dataController.js'
import { validateBody } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import { deleteAccountSchema } from '../validators/dataValidators.js'

const router = Router()
router.use(authenticate)

router.get('/export', exportData)
router.delete('/account', validateBody(deleteAccountSchema), remove)

export default router
