import { Router } from 'express'
import { getActivity, getProfile, getFeed } from '../controllers/communityController.js'
import { postKudos, deleteKudos } from '../controllers/kudosController.js'
import { getComments, postComment, patchComment, removeComment, postCommentLike, deleteCommentLike } from '../controllers/commentController.js'
import { reportActivity, reportComment } from '../controllers/reportController.js'
import { postFollow, deleteFollow } from '../controllers/followController.js'
import { optionalAuthenticate } from '../middleware/optionalAuthenticate.js'
import { authenticate } from '../middleware/authenticate.js'
import { communityWriteRateLimiter } from '../middleware/rateLimit.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { createCommentSchema, listCommentsQuerySchema } from '../validators/commentValidators.js'
import { createReportSchema } from '../validators/reportValidators.js'

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
// request outright. `communityWriteRateLimiter` always comes AFTER
// `authenticate` on every route below, deliberately — its keyGenerator
// reads req.userId, which only exists once authenticate has run. See
// docs/08_COMMUNITY_PROPOSAL.md §14 (M11 — Cross-Feature Security Audit
// closes this pre-existing gap: rate limiting did not exist anywhere in
// the codebase before this milestone).
router.post('/activities/:id/kudos', authenticate, communityWriteRateLimiter, postKudos)
router.delete('/activities/:id/kudos', authenticate, communityWriteRateLimiter, deleteKudos)

// Comments — listing is readable by anyone (matches the router's default
// optionalAuthenticate), same as the activity itself; writing/editing/
// deleting require real authentication. `postComment` also handles
// replies (an optional parentCommentId in the body, capped at one level
// deep — enforced in commentService, not here) — a reply is not a
// separate route/resource, just a Comment with a parent reference.
router.get('/activities/:id/comments', validateQuery(listCommentsQuerySchema), getComments)
router.post('/activities/:id/comments', authenticate, communityWriteRateLimiter, validateBody(createCommentSchema), postComment)
router.patch('/comments/:commentId', authenticate, communityWriteRateLimiter, validateBody(createCommentSchema), patchComment)
router.delete('/comments/:commentId', authenticate, communityWriteRateLimiter, removeComment)

// Comment likes — a write, same authentication requirement as everything
// else on this router. Applies equally to top-level comments and replies
// (both are just Comment documents); commentLikeService re-verifies the
// comment's parent activity is still public, same pattern as reports.
router.post('/comments/:commentId/like', authenticate, communityWriteRateLimiter, postCommentLike)
router.delete('/comments/:commentId/like', authenticate, communityWriteRateLimiter, deleteCommentLike)

// Reporting — a write, same as kudos/comments: requires real
// authentication. targetType is implied by the route hit, never trusted
// from the request body. See docs/08_COMMUNITY_PROPOSAL.md §7.
router.post('/activities/:id/reports', authenticate, communityWriteRateLimiter, validateBody(createReportSchema), reportActivity)
router.post('/comments/:commentId/reports', authenticate, communityWriteRateLimiter, validateBody(createReportSchema), reportComment)

// Following — a write, same authentication requirement as kudos/comments/
// reports. Targets are resolved by username (matching the profile route's
// own convention), re-verified live against isPublicProfile inside
// followService, never trusted from an earlier read. See
// docs/08_COMMUNITY_PROPOSAL.md §6.
router.post('/users/:username/follow', authenticate, communityWriteRateLimiter, postFollow)
router.delete('/users/:username/follow', authenticate, communityWriteRateLimiter, deleteFollow)

export default router
