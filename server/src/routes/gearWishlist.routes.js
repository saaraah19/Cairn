import { Router } from 'express'
import {
  create,
  list,
  getById,
  update,
  remove,
  postOption,
  patchOption,
  removeOption,
  postPurchaseOption,
} from '../controllers/gearWishlistController.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { authenticate } from '../middleware/authenticate.js'
import {
  createWishlistItemSchema,
  updateWishlistItemSchema,
  listWishlistItemsQuerySchema,
  optionSchema,
  updateOptionSchema,
} from '../validators/gearWishlistValidators.js'

// Unconditionally authenticated, same contract as gear.routes.js — this
// is entirely personal data with no public-read path, unlike Community.
const router = Router()
router.use(authenticate)

router.get('/', validateQuery(listWishlistItemsQuerySchema), list)
router.post('/', validateBody(createWishlistItemSchema), create)
router.get('/:id', getById)
router.patch('/:id', validateBody(updateWishlistItemSchema), update)
router.delete('/:id', remove)

router.post('/:id/options', validateBody(optionSchema), postOption)
router.patch('/:id/options/:optionId', validateBody(updateOptionSchema), patchOption)
router.delete('/:id/options/:optionId', removeOption)

// Deliberately POST, not PATCH — this isn't a field update, it's an
// action with a real side effect (creates a new GearItem). See
// gearWishlistService.js's purchaseOption for the full reasoning.
router.post('/:id/options/:optionId/purchase', postPurchaseOption)

export default router
