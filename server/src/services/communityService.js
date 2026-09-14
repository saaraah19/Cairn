import { Activity } from '../models/Activity.js'
import { User } from '../models/User.js'
import { Group } from '../models/Group.js'
import { Destination } from '../models/Destination.js'
import { Photo } from '../models/Photo.js'
import { ApiError } from '../utils/apiResponse.js'
import { getPublicStatistics } from './communityStatisticsService.js'
import { hasUserGivenKudos } from './kudosService.js'
import { isFollowing } from './followService.js'
import { Follow } from '../models/Follow.js'

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

// Resolves an activity's author to a minimal public reference. The name is
// always shown — it's already effectively attached to a public activity, so
// hiding it entirely would just be confusing without adding real privacy.
// `username` is the ONLY thing gated on `isPublicProfile`: linking anywhere
// (Follow, the profile page) only makes sense once that's been explicitly
// opted into, otherwise the link 404s. This is the actual mechanism that
// makes a profile/Follow reachable from a public activity at all — see
// PublicActivityCard.jsx / PublicActivityDetail.jsx, which render a plain
// (unlinked) name when username is null.
async function resolvePublicAuthor(userId) {
  const user = await User.findById(userId).select('name username isPublicProfile').lean()
  if (!user) return { name: 'A hiker', username: null }
  return {
    name: user.name,
    username: user.isPublicProfile ? user.username : null,
  }
}

// A single lightweight photo for card/list display — reuses the same
// Activity.coverPhotoId reference the private activityService already
// populates for its own list view (see activityService.js's
// `.populate('coverPhotoId', 'secureUrl')`), rather than a second,
// separate Photo query. `activity` here must already have coverPhotoId
// populated by the caller (paginatePublicActivities / getPublicActivityById)
// — this function just whitelists the result down to `secureUrl`, same
// reasoning as every other resolver in this file.
function resolvePublicCoverPhoto(activity) {
  return activity.coverPhotoId?.secureUrl ? { secureUrl: activity.coverPhotoId.secureUrl } : null
}

// The full gallery — only resolved for a single activity's detail view,
// never for a list/feed page, to avoid an unbounded N-photos-per-card
// query cost across a whole page of results. A direct Photo query (not
// coverPhotoId) since it needs every photo, not just the one cover
// reference. Whitelisted to exactly what PublicPhotoGallery.jsx needs: no
// cloudinaryPublicId, no userId.
async function resolvePublicPhotos(activityId) {
  const photos = await Photo.find({ activityId }).select('secureUrl').sort({ isCover: -1, createdAt: 1 }).lean()
  return photos.map((p) => ({ id: p._id, secureUrl: p.secureUrl }))
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
// Photos: `coverPhoto` (a single lightweight reference) is resolved here,
// in every DTO, for card/list display. The full gallery (`photos`) is
// deliberately NOT resolved here — it's only attached in
// getPublicActivityById, for the single-activity detail view, to avoid an
// unbounded per-photo query cost across a whole feed/profile page of cards.
export async function toPublicActivityDTO(activity) {
  const [groupName, destination, author] = await Promise.all([
    resolvePublicGroupName(activity.social?.groupId),
    resolvePublicDestination(activity.destinationId),
    resolvePublicAuthor(activity.userId),
  ])
  const coverPhoto = resolvePublicCoverPhoto(activity)

  return {
    id: activity._id,
    authorId: activity.userId,
    author,
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
    coverPhoto,
    kudosCount: activity.kudosCount ?? 0,
    commentsCount: activity.commentsCount ?? 0,
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
  const activity = await Activity.findOne({ _id: activityId, visibility: 'public' }).populate(
    'coverPhotoId',
    'secureUrl'
  )
  if (!activity) {
    throw new ApiError(404, 'NOT_FOUND', 'Activity not found.')
  }
  const dto = await toPublicActivityDTO(activity)
  // hasKudos reflects the specific person viewing, so it's attached here
  // (per-request) rather than inside the DTO builder itself, which has no
  // notion of "who's asking" — only "what's this activity's public shape."
  dto.hasKudos = await hasUserGivenKudos(viewerUserId, activityId)
  // The full gallery is only ever resolved here, for a single activity —
  // see resolvePublicPhotos's own comment for why it's excluded from the
  // shared DTO builder used by feed/profile lists.
  dto.photos = await resolvePublicPhotos(activity._id)
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
    .populate('coverPhotoId', 'secureUrl')

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
// `scope: 'following'` requires a real authenticated viewer — "my
// following feed" has no meaning for an anonymous request, so this
// rejects with 401 rather than silently falling back to Explore (the
// same "don't silently redefine the request" instinct M4 already applied
// when scope=following didn't exist yet). Once the viewer is known, this
// resolves followerId -> followingId list via Follow's unique-index
// prefix, then reuses the exact same paginatePublicActivities core as
// Explore, with { userId: { $in: followingIds } } added — no new
// infrastructure, per docs/08_COMMUNITY_PROPOSAL.md §9. Per the resolved
// edge case in §6, this never additionally checks the followed user's
// current isPublicProfile — Activity.visibility is the only content-
// visibility gate, exactly as Explore already treats everyone.
// Escapes regex special characters in free-text user input before it's
// used to build a MongoDB RegExp filter — without this, a search/wilaya
// value like "(" would throw an "Invalid regular expression" error, and
// certain patterns could otherwise behave as a user-controlled regex
// rather than a literal substring match.
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export async function listPublicFeed({
  scope = 'explore',
  type,
  wilaya,
  search,
  cursor,
  limit = 12,
  viewerUserId,
} = {}) {
  const filter = {}
  if (type) filter.type = type
  if (wilaya) filter['location.wilaya'] = new RegExp(escapeRegex(wilaya), 'i')

  // Search matches the AUTHOR's name/username, not the activity's own
  // name — the person asked for "search by name/username" specifically.
  // Resolved to a set of matching userIds up front (a DB-level lookup,
  // not fetch-then-filter), then combined with whatever scope-specific
  // userId constraint (e.g. Following's followingIds) already applies.
  // Not gated by isPublicProfile: a private-profile user's PUBLIC
  // activities are already legitimately discoverable and already show
  // that user's name via author attribution (§4's decoupling) — search
  // surfaces nothing that browsing wouldn't already reveal.
  let searchUserIds = null
  const trimmedSearch = search?.trim()
  if (trimmedSearch) {
    const pattern = new RegExp(escapeRegex(trimmedSearch), 'i')
    const matchedUsers = await User.find({ $or: [{ name: pattern }, { username: pattern }] }).select('_id')
    searchUserIds = matchedUsers.map((u) => u._id)
  }

  if (scope === 'explore') {
    if (searchUserIds) filter.userId = { $in: searchUserIds }
    return paginatePublicActivities(filter, { cursor, limit })
  }

  if (scope === 'following') {
    if (!viewerUserId) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'You must be logged in to view your following feed.')
    }
    const follows = await Follow.find({ followerId: viewerUserId }).select('followingId').lean()
    let followingIds = follows.map((f) => f.followingId)
    if (searchUserIds) {
      // Intersection: must be BOTH someone the viewer follows AND a
      // search match — searching your following feed searches within it,
      // it doesn't expand it to the whole platform.
      const matchedSet = new Set(searchUserIds.map(String))
      followingIds = followingIds.filter((id) => matchedSet.has(String(id)))
    }
    filter.userId = { $in: followingIds }
    return paginatePublicActivities(filter, { cursor, limit })
  }

  throw new ApiError(422, 'VALIDATION_ERROR', `Feed scope "${scope}" is not available yet.`)
}

// Looks up a single profile for public display. Same non-distinguishing
// 404 discipline as getPublicActivityById: a private (opted-out) profile
// produces the identical response as a nonexistent username. Statistics
// come from the dedicated communityStatisticsService, never
// statisticsService — see docs/08_COMMUNITY_PROPOSAL.md §3.
export async function getPublicProfileByUsername(username, { activitiesCursor, viewerUserId } = {}) {
  const user = await User.findOne({ username, isPublicProfile: true })
  if (!user) {
    throw new ApiError(404, 'NOT_FOUND', 'Profile not found.')
  }

  const [statistics, activityPage, viewerIsFollowing] = await Promise.all([
    getPublicStatistics(user._id),
    listPublicActivitiesByUser(user._id, { cursor: activitiesCursor, limit: 12 }),
    isFollowing(viewerUserId, user._id),
  ])

  return {
    profile: toPublicProfileDTO(user),
    statistics,
    activities: activityPage.activities,
    nextCursor: activityPage.nextCursor,
    isFollowing: viewerIsFollowing,
  }
}
