import { Activity } from '../models/Activity.js'

const DIFFICULTY_RANK = { easy: 1, moderate: 2, hard: 3, very_hard: 4 }

// Two different privacy postures in one function, deliberately:
//   - `totals` are computed from the user's ENTIRE activity history
//     (public + private) — a 2026-09-13 product decision: a profile's
//     headline numbers ("47 activities, 620 km") shouldn't understate
//     someone's real outdoor life just because most of it is private.
//     Only raw trail numbers are selected for this set — never name,
//     date, location, or review — so no private activity's identity or
//     content is ever loaded for this computation, only its numbers.
//   - `records` (which activity was the longest/highest/hardest/
//     highest-rated) stay scoped to PUBLIC activities only, unchanged
//     from the original design. A record links to a specific activity
//     page (`{ id, name }`) — if it were allowed to point at a private
//     activity, the profile would leak that activity's name and
//     existence to every visitor, which is a much sharper leak than a
//     bigger aggregate number and violates the hard "never expose a
//     private activity" invariant. If a user's real longest hike is
//     private, the public record simply reflects their longest *public*
//     one instead — never nothing, but never the private one either.
export async function getPublicStatistics(userId) {
  const [allActivities, publicActivities] = await Promise.all([
    Activity.find({ userId }).select('trail'),
    Activity.find({ userId, visibility: 'public' }).select('name date type trail review'),
  ])

  const totals = {
    activities: allActivities.length,
    distanceKm: 0,
    durationMinutes: 0,
    elevationGainM: 0,
    elevationLossM: 0,
  }

  for (const a of allActivities) {
    const trail = a.trail ?? {}
    totals.distanceKm += trail.distanceKm ?? 0
    totals.durationMinutes += trail.durationMinutes ?? 0
    totals.elevationGainM += trail.elevationGainM ?? 0
    totals.elevationLossM += trail.elevationLossM ?? 0
  }
  totals.distanceKm = Math.round(totals.distanceKm * 10) / 10

  const records = {
    highestAltitudeM: null,
    highestAltitudeActivity: null,
    longestDistanceKm: null,
    longestDistanceActivity: null,
    hardestDifficulty: null,
    hardestActivity: null,
    highestRating: null,
    highestRatedActivity: null,
  }

  const publicRef = (a) => ({ id: a._id, name: a.name })

  for (const a of publicActivities) {
    const trail = a.trail ?? {}
    const review = a.review ?? {}

    if (trail.maxAltitudeM != null && (records.highestAltitudeM == null || trail.maxAltitudeM > records.highestAltitudeM)) {
      records.highestAltitudeM = trail.maxAltitudeM
      records.highestAltitudeActivity = publicRef(a)
    }

    if (trail.distanceKm != null && (records.longestDistanceKm == null || trail.distanceKm > records.longestDistanceKm)) {
      records.longestDistanceKm = trail.distanceKm
      records.longestDistanceActivity = publicRef(a)
    }

    const difficultyRank = DIFFICULTY_RANK[trail.difficulty]
    if (difficultyRank && (records.hardestDifficulty == null || difficultyRank > DIFFICULTY_RANK[records.hardestDifficulty])) {
      records.hardestDifficulty = trail.difficulty
      records.hardestActivity = publicRef(a)
    }

    if (review.rating != null && (records.highestRating == null || review.rating > records.highestRating)) {
      records.highestRating = review.rating
      records.highestRatedActivity = publicRef(a)
    }
  }

  return { totals, records }
}
