import { Router } from 'express'
import { get, update, updatePassword, uploadPicture, removePicture } from '../controllers/profileController.js'
import { validateBody } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import { handleUpload } from '../middleware/upload.js'
import { updateProfileSchema, changePasswordSchema } from '../validators/profileValidators.js'

const router = Router()
router.use(authenticate)

router.get('/', get)
router.patch('/', validateBody(updateProfileSchema), update)
router.patch('/password', validateBody(changePasswordSchema), updatePassword)
router.post('/picture', handleUpload, uploadPicture)
router.delete('/picture', removePicture)

export default router
