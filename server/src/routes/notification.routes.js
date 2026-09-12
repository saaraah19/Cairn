import { Router } from 'express'
import {
  getNotifications,
  getUnreadCountHandler,
  patchMarkAsRead,
  patchMarkAllAsRead,
} from '../controllers/notificationController.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateQuery } from '../middleware/validate.js'
import { listNotificationsQuerySchema } from '../validators/notificationValidators.js'

// Unlike community.routes.js, this is unconditionally gated by
// `authenticate`, not `optionalAuthenticate` — a notifications inbox has
// no meaning for a logged-out visitor, and every route here only ever
// reads or writes the caller's own data (docs/02_TECHNICAL_ARCHITECTURE.md
// §9), same contract as activity.routes.js.
const router = Router()
router.use(authenticate)

router.get('/', validateQuery(listNotificationsQuerySchema), getNotifications)
router.get('/unread-count', getUnreadCountHandler)
router.patch('/read-all', patchMarkAllAsRead)
router.patch('/:id/read', patchMarkAsRead)

export default router
