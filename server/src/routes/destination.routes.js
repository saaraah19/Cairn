import { Router } from 'express'
import {
  create,
  list,
  getById,
  update,
  remove,
  uploadCoverImage,
  removeCoverImage,
  related,
} from '../controllers/destinationController.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import { handleUpload } from '../middleware/upload.js'
import {
  createDestinationSchema,
  updateDestinationSchema,
  listDestinationsQuerySchema,
} from '../validators/destinationValidators.js'

const router = Router()
router.use(authenticate)

router.get('/', validateQuery(listDestinationsQuerySchema), list)
router.post('/', validateBody(createDestinationSchema), create)
router.get('/:id', getById)
router.patch('/:id', validateBody(updateDestinationSchema), update)
router.delete('/:id', remove)
router.get('/:id/related', related)
router.post('/:id/cover-image', handleUpload, uploadCoverImage)
router.delete('/:id/cover-image', removeCoverImage)

export default router
