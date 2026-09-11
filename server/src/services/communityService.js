import { Activity } from '../models/Activity.js'
import { User } from '../models/User.js'
import { Group } from '../models/Group.js'
import { Destination } from '../models/Destination.js'
import { ApiError } from '../utils/apiResponse.js'
import { getPublicStatistics } from './communityStatisticsService.js'
import { hasUserGivenKudos } from './kudosService.js'

// Whitelist-only public DTO builders — see docs/08_COMMUNITY_PROPOSAL.md §2
// (Activity field matrix) and §3 (Profile field matrix). Every field below
// is constructed explicitly, one at a time — never `{ ...activity }` or
// `{ ...activity.social }`. This is a deliberate, hard rule: a field added
// to the private Activity/User schema later is invisible to (and therefore
// safe from) an explicit whitelist, whereas it would silently leak through
// a spread. This file is the *only* place a public Community response is
// allowed to be assembled from a private Mongoose document — activityService
// and userService/profileService are never called from any Community route.

// Resolves an Activity's social.groupId to just its name — never the raw
// ObjectId, never any other Group field. Returns null if the group has been
// deleted (the codebase's already-documented dangling-reference behavior;
// see PROGRESS.md Known Issues) rather than throwing.
export async function resolvePublicGroupName(groupId) {
  if (!groupId) return null
  const group = await Group.findById(groupId).select('name').lean()
  return group?.name ?? null
}

// Resolves an Activity's destinationId to a minimal public reference — never
// the full private Destination document, which can carry the owner's own
// private notes/links/targetDate.
export async function resolvePublicDestination(destinationId) {
  if (!destinationId) return null
  const destination = await Destination.findById(destinationId).select('name location.wilaya').lean()
  if (!destination) return null
  return { name: destination.name, wilaya: destination.location?.wilaya ?? '' }
}

// Builds the public representation of an Activity. The caller is
// responsible for having already verified `activity.visibility === 'public'`
// at query time (see docs/08_COMMUNITY_PROPOSAL.md §9-10) — this function
// does not re-check visibility itself, it only ever controls *which fields*
// are exposed once an activity is already known to be public.
//
// Deliberately excluded, permanently, regardless of any future field added
// to Activity.js: activityNumber, location.latitude/longitude,
// social.companions, costDzd, review.notes, gearItemIds, visibility itself,
// and any raw ObjectId reference other than the activity's own id and its
// author's id (needed for routing/attribution, not private data on its own).
//
// Photos/coverPhotoId are intentionally not resolved here yet — building
// that requires deciding, at the point an actual public activity endpoint
// is wired (M2), how much of the Photo collection to expose (a single cover
// image vs. the full gallery), which is a real product/API-shape decision
// this foundation milestone shouldn't pre-empt speculatively.
export async function toPublicActivityDTO(activity) {
  const [groupName, destination] = await Promise.all([
    resolvePublicGroupName(activity.social?.groupId),
    resolvePublicDestination(activity.destinationId),
  ])

  return {
    id: activity._id,
    authorId: activity.userId,
    name: activity.name,
    type: activity.type,
    date: activity.date,
    location: {
      placeName: activity.location?.placeName ?? '',
      wilaya: activity.location?.wilaya ?? '',
      country: activity.location?.country ?? '',
      // No latitude/longitude — see docs/08_COMMUNITY_PROPOSAL.md §2,
      // exact coordinates are an architectural invariant, never public.
    },
    trail: {
      distanceKm: activity.trail?.distanceKm ?? null,
      durationMinutes: activity.trail?.durationMinutes ?? null,
      maxAltitudeM: activity.trail?.maxAltitudeM ?? null,
      elevationGainM: activity.trail?.elevationGainM ?? null,
      elevationLossM: activity.trail?.elevationLossM ?? null,
      difficulty: activity.trail?.difficulty ?? null,
    },
    conditions: {
      weather: activity.conditions?.weather ?? null,
      temperatureC: activity.conditions?.temperatureC ?? null,
      trailCondition: activity.conditions?.trailCondition ?? null,
    },
    social: {
      groupName,
      // No companions — never public, see §2.
    },
    review: {
      rating: activity.review?.rating ?? null,
      challenges: activity.review?.challenges ?? '',
      // No notes — never public, under any circumstance, see §2.
    },
    publicCaption: activity.publicCaption ?? '',
    destination,
    kudosCount: activity.kudosCount ?? 0,
    createdAt: activity.createdAt,
    // No costDzd, gearItemIds, activityNumber, visibility.
  }
}

// Builds the public representation of a User's profile. The caller is
// responsible for having already verified `user.isPublicProfile === true`.
// Statistics scoped to public activities only (never the user's real
// totals) are a separate, dedicated query belonging to M3 (Public
// Profiles) — deliberately not stubbed here, since a stub with no real
// query behind it is worse than no field at all.
export function toPublicProfileDTO(user) {
  return {
    id: user._id,
    name: user.name,
    username: user.username,
    profilePicture: user.profilePicture?.secureUrl ? { secureUrl: user.profilePicture.secureUrl } : null,
    bio: user.bio ?? '',
    location: user.location ?? '',
    // No email, preferences, passwordHash, googleId, authProviders.
  }
}

// Looks up a single activity for public display. Query-level filtering
// (never fetch-then-filter) is the enforcement mechanism: a private
// activity simply doesn't match this query and produces the exact same
// 404 as a nonexistent one — non-distinguishing, matching the same
// pattern used by every owned-resource lookup elsewhere in the app (see
// e.g. destinationService.getOwnedDestination). A public → private flip
// takes effect immediately on the next read, since nothing here is cached
// (docs/08_COMMUNITY_PROPOSAL.md §9).
export async function getPublicActivityById(activityId, viewerUserId) {
  const activity = await Activity.findOne({ _id: activityId, visibility: 'public' })
  if (!activity) {
    throw new ApiError(404, 'NOT_FOUND', 'Activity not found.')
  }
  const dto = await toPublicActivityDTO(activity)
  // hasKudos reflects the specific person viewing, so it's attached here
  // (per-request) rather than inside the DTO builder itself, which has no
  // notion of "who's asking" — only "what's this activity's public shape."
  dto.hasKudos = await hasUserGivenKudos(viewerUserId, activityId)
  return dto
}

// Shared cursor-pagination core (date + _id tiebreaker), not offset/page
// pagination — a deliberate product-owner instruction for every Community
// list endpoint (docs/08_COMMUNITY_PROPOSAL.md §7/§9), even though the
// private activity list (activityService.listActivities) uses offset
// pagination. Used by both listPublicActivitiesByUser (M3) and
// listPublicFeed (M4) — same query shape, different base filter.
async function paginatePublicActivities(baseFilter, { cursor, limit = 12 } = {}) {
  const filter = { ...baseFilter, visibility: 'public' }

  if (cursor) {
    const [dateIso, lastId] = cursor.split('_')
    filter.$or = [{ date: { $lt: new Date(dateIso) } }, { date: new Date(dateIso), _id: { $lt: lastId } }]
  }

  const rows = await Activity.find(filter)
    .sort({ date: -1, _id: -1 })
    .limit(limit + 1)

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows

  const activities = await Promise.all(page.map(toPublicActivityDTO))
  const last = page[page.length - 1]
  const nextCursor = hasMore && last ? `${last.date.toISOString()}_${last._id}` : null

  return { activities, nextCursor }
}

export async function listPublicActivitiesByUser(userId, { cursor, limit = 12 } = {}) {
  return paginatePublicActivities({ userId }, { cursor, limit })
}

// Explore feed — global, chronological, optionally filtered by type/wilaya.
// No ranking, no "For You" logic, no popularity sort: strictly
// { date: -1, _id: -1 }, matching docs/08_COMMUNITY_PROPOSAL.md §6-7's
// explicit rejection of algorithmic/trending feeds. wilaya uses the same
// case-insensitive substring match as the private activity list
// (activityService.listActivities), for a consistent filtering feel
// between "my activities" and "Explore".
//
// `scope: 'following'` is intentionally not handled here yet — that
// requires the Follow model, which doesn't exist until M8. Passing it
// today throws a clear validation error rather than silently falling back
// to Explore, which would be a confusing, easy-to-miss product behavior.
export async function listPublicFeed({ scope = 'explore', type, wilaya, cursor, limit = 12 } = {}) {
  if (scope !== 'explore') {
    throw new ApiError(422, 'VALIDATION_ERROR', `Feed scope "${scope}" is not available yet.`)
  }

  const filter = {}
  if (type) filter.type = type
  if (wilaya) filter['location.wilaya'] = new RegExp(wilaya, 'i')

  return paginatePublicActivities(filter, { cursor, limit })
}

// Looks up a single profile for public display. Same non-distinguishing
// 404 discipline as getPublicActivityById: a private (opted-out) profile
// produces the identical response as a nonexistent username. Statistics
// come from the dedicated communityStatisticsService, never
// statisticsService — see docs/08_COMMUNITY_PROPOSAL.md §3.
export async function getPublicProfileByUsername(username, { activitiesCursor } = {}) {
  const user = await User.findOne({ username, isPublicProfile: true })
  if (!user) {
    throw new ApiError(404, 'NOT_FOUND', 'Profile not found.')
  }

  const [statistics, activityPage] = await Promise.all([
    getPublicStatistics(user._id),
    listPublicActivitiesByUser(user._id, { cursor: activitiesCursor, limit: 12 }),
  ])

  return {
    profile: toPublicProfileDTO(user),
    statistics,
    activities: activityPage.activities,
    nextCursor: activityPage.nextCursor,
  }
}
