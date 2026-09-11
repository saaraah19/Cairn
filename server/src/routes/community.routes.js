import { Router } from 'express'
import { getActivity, getProfile } from '../controllers/communityController.js'
import { optionalAuthenticate } from '../middleware/optionalAuthenticate.js'

// Deliberately a separate router from activity.routes.js, not a set of
// extra routes bolted onto it — activity.routes.js is unconditionally
// gated by `authenticate` and is explicitly the "your own data" contract.
// Community routes use optionalAuthenticate instead: reachable by
// logged-out visitors, but still aware of who's asking when someone is
// logged in (needed by later milestones, e.g. "have I already kudos'd
// this?"). See docs/08_COMMUNITY_PROPOSAL.md §2.
const router = Router()
router.use(optionalAuthenticate)

router.get('/activities/:id', getActivity)
router.get('/users/:username', getProfile)

export default router
