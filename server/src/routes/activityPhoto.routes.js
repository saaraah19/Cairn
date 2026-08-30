import { Router } from 'express'
import { upload, list, setCover } from '../controllers/photoController.js'
import { handleUpload } from '../middleware/upload.js'

// mergeParams so :id (activityId) from the parent /api/activities/:id
// mount point is visible on req.params here.
const router = Router({ mergeParams: true })

router.get('/', list)
router.post('/', handleUpload, upload)
router.patch('/:photoId/cover', setCover)

export default router
