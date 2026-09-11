import { Activity } from '../models/Activity.js'

const DIFFICULTY_RANK = { easy: 1, moderate: 2, hard: 3, very_hard: 4 }

// Deliberately NOT a reuse of statisticsService.getStatistics, and
// deliberately not "call it then filter its output" — that would still
// require fetching the user's real (including private) activities into
// memory first. This queries with { userId, visibility: 'public' } as part
// of the filter itself, so a private activity is never even read off disk
// for this computation, let alone included in a total.
//
// Also intentionally a smaller field set than the private statistics page:
// no gearValueDzd (gear is never public, see docs/08_COMMUNITY_PROPOSAL.md
// §2), no byWilaya/byYear/byDifficulty breakdowns (not required for this
// milestone's definition of done — can be added later without disturbing
// this shape). Record references use only { id, name } — never
// activityNumber, which is never public (see the same §2 field matrix).
export async function getPublicStatistics(userId) {
  const activities = await Activity.find({ userId, visibility: 'public' }).select(
    'name date type trail review'
  )

  const totals = {
    activities: activities.length,
    distanceKm: 0,
    durationMinutes: 0,
    elevationGainM: 0,
    elevationLossM: 0,
  }

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

  for (const a of activities) {
    const trail = a.trail ?? {}
    const review = a.review ?? {}

    totals.distanceKm += trail.distanceKm ?? 0
    totals.durationMinutes += trail.durationMinutes ?? 0
    totals.elevationGainM += trail.elevationGainM ?? 0
    totals.elevationLossM += trail.elevationLossM ?? 0

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

  totals.distanceKm = Math.round(totals.distanceKm * 10) / 10

  return { totals, records }
}
