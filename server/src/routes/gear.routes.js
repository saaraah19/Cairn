import { Router } from 'express'
import {
  create,
  list,
  listStores,
  getById,
  update,
  remove,
  usage,
  uploadPhoto,
  removePhoto,
} from '../controllers/gearController.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import { handleUpload } from '../middleware/upload.js'
import { createGearSchema, updateGearSchema, listGearQuerySchema } from '../validators/gearValidators.js'

const router = Router()
router.use(authenticate)

router.get('/', validateQuery(listGearQuerySchema), list)
// Must be registered BEFORE '/:id' — otherwise Express would treat
// "stores" as an :id value and route it to getById instead.
router.get('/stores', listStores)
router.post('/', validateBody(createGearSchema), create)
router.get('/:id', getById)
router.patch('/:id', validateBody(updateGearSchema), update)
router.delete('/:id', remove)
router.get('/:id/usage', usage)
router.post('/:id/photo', handleUpload, uploadPhoto)
router.delete('/:id/photo', removePhoto)

export default router
