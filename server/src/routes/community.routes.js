import { Router } from 'express'
import { getActivity, getProfile, getFeed } from '../controllers/communityController.js'
import { postKudos, deleteKudos } from '../controllers/kudosController.js'
import { getComments, postComment, patchComment, removeComment } from '../controllers/commentController.js'
import { optionalAuthenticate } from '../middleware/optionalAuthenticate.js'
import { authenticate } from '../middleware/authenticate.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { createCommentSchema, listCommentsQuerySchema } from '../validators/commentValidators.js'

// Deliberately a separate router from activity.routes.js, not a set of
// extra routes bolted onto it — activity.routes.js is unconditionally
// gated by `authenticate` and is explicitly the "your own data" contract.
// Community routes use optionalAuthenticate instead: reachable by
// logged-out visitors, but still aware of who's asking when someone is
// logged in (needed by later milestones, e.g. "have I already kudos'd
// this?"). See docs/08_COMMUNITY_PROPOSAL.md §2.
const router = Router()
router.use(optionalAuthenticate)

router.get('/feed', getFeed)
router.get('/activities/:id', getActivity)
router.get('/users/:username', getProfile)

// Kudos are a write, not a read — they require a real, verified session,
// not merely an optional one. Stacking `authenticate` after the router's
// `optionalAuthenticate` is safe (it just re-verifies the same cookie) and
// keeps these routes as the ones on this router that reject an anonymous
// request outright.
router.post('/activities/:id/kudos', authenticate, postKudos)
router.delete('/activities/:id/kudos', authenticate, deleteKudos)

// Comments — listing is readable by anyone (matches the router's default
// optionalAuthenticate), same as the activity itself; writing/editing/
// deleting require real authentication.
router.get('/activities/:id/comments', validateQuery(listCommentsQuerySchema), getComments)
router.post('/activities/:id/comments', authenticate, validateBody(createCommentSchema), postComment)
router.patch('/comments/:commentId', authenticate, validateBody(createCommentSchema), patchComment)
router.delete('/comments/:commentId', authenticate, removeComment)

export default router
