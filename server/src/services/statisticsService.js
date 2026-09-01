import { Activity } from '../models/Activity.js'

const DIFFICULTY_RANK = { easy: 1, moderate: 2, hard: 3, very_hard: 4 }

// Personal statistics are entirely derived from Activity records, never
// stored, per docs/05_DATA_MODEL_AND_API_CONTRACT.md §37-38 and §63 ("Do
// not duplicate sources of truth"). For V1's personal-scale data volume,
// fetching everything and reducing in JS is simpler and easier to maintain
// than a MongoDB aggregation pipeline, and fast enough — see
// docs/02_TECHNICAL_ARCHITECTURE.md §54 ("prefer the solution that is
// easier to understand... sufficient for V1").
export async function getStatistics(userId) {
  const activities = await Activity.find({ userId }).select(
    'activityNumber name date type trail review location.wilaya'
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

  const byType = new Map()
  const byDifficulty = new Map()
  const byYear = new Map()
  const byWilaya = new Map()

  const ref = (a) => ({ _id: a._id, activityNumber: a.activityNumber, name: a.name })

  for (const a of activities) {
    const trail = a.trail ?? {}
    const review = a.review ?? {}

    totals.distanceKm += trail.distanceKm ?? 0
    totals.durationMinutes += trail.durationMinutes ?? 0
    totals.elevationGainM += trail.elevationGainM ?? 0
    totals.elevationLossM += trail.elevationLossM ?? 0

    if (trail.maxAltitudeM != null && (records.highestAltitudeM == null || trail.maxAltitudeM > records.highestAltitudeM)) {
      records.highestAltitudeM = trail.maxAltitudeM
      records.highestAltitudeActivity = ref(a)
    }

    if (trail.distanceKm != null && (records.longestDistanceKm == null || trail.distanceKm > records.longestDistanceKm)) {
      records.longestDistanceKm = trail.distanceKm
      records.longestDistanceActivity = ref(a)
    }

    const difficultyRank = DIFFICULTY_RANK[trail.difficulty]
    if (difficultyRank && (records.hardestDifficulty == null || difficultyRank > DIFFICULTY_RANK[records.hardestDifficulty])) {
      records.hardestDifficulty = trail.difficulty
      records.hardestActivity = ref(a)
    }

    if (review.rating != null && (records.highestRating == null || review.rating > records.highestRating)) {
      records.highestRating = review.rating
      records.highestRatedActivity = ref(a)
    }

    byType.set(a.type, (byType.get(a.type) ?? 0) + 1)

    if (trail.difficulty) {
      byDifficulty.set(trail.difficulty, (byDifficulty.get(trail.difficulty) ?? 0) + 1)
    }

    const year = new Date(a.date).getFullYear()
    byYear.set(year, (byYear.get(year) ?? 0) + 1)

    const wilaya = a.location?.wilaya
    if (wilaya) {
      byWilaya.set(wilaya, (byWilaya.get(wilaya) ?? 0) + 1)
    }
  }

  // Round accumulated floating-point sums to a sane precision for display.
  totals.distanceKm = Math.round(totals.distanceKm * 10) / 10

  const toSortedArray = (map, keyName) =>
    [...map.entries()]
      .map(([key, count]) => ({ [keyName]: key, count }))
      .sort((a, b) => b.count - a.count)

  return {
    totals,
    records,
    breakdowns: {
      byType: toSortedArray(byType, 'type'),
      byDifficulty: toSortedArray(byDifficulty, 'difficulty'),
      byYear: toSortedArray(byYear, 'year').sort((a, b) => b.year - a.year),
      byWilaya: toSortedArray(byWilaya, 'wilaya').slice(0, 8), // top 8 — avoid a sprawling list
    },
  }
}
