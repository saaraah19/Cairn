// M3 — Public Profiles: mocked unit verification.
//
// Same sandbox limitation as M1/M2 (no MongoDB reachable here) — this
// stubs the model calls directly. Updated 2026-09-13 for the product
// decision to show OVERALL totals (public + private) on the public
// profile, while keeping RECORDS (which specific activity holds the
// longest/highest/hardest/highest-rated title) scoped to public
// activities only — see communityStatisticsService.js's own comment for
// why: a record links to a specific activity page, so letting it point at
// a private activity would leak that activity's name and existence,
// which is a much sharper leak than a bigger aggregate number.
//
// Usage: node scripts/test-community-m3-unit.js

import { Activity } from '../src/models/Activity.js'
import { User } from '../src/models/User.js'
import { getPublicStatistics } from '../src/services/communityStatisticsService.js'
import { getPublicProfileByUsername } from '../src/services/communityService.js'

let failures = 0

function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`)
    failures += 1
  } else {
    console.log(`✓ ${message}`)
  }
}

async function run() {
  console.log('=== M3 — Public Profiles: mocked unit verification ===\n')

  // A user with 1 public activity (8km, rating 7) and 1 private activity
  // (100km, rating 10). Totals should now reflect BOTH (108km, 2
  // activities) — but the highest-RATED record must still point at the
  // public one, never the private 100km/rating-10 activity.
  const publicActivity = {
    _id: 'act-public',
    name: 'Public Hike',
    date: new Date('2026-05-01'),
    type: 'hiking',
    trail: { distanceKm: 8, durationMinutes: 120, maxAltitudeM: 900, elevationGainM: 400, difficulty: 'moderate' },
    review: { rating: 7 },
    visibility: 'public',
  }
  const privateActivity = {
    _id: 'act-private',
    name: 'Secret Long Hike',
    date: new Date('2026-05-02'),
    type: 'hiking',
    trail: { distanceKm: 100, durationMinutes: 5000, maxAltitudeM: 3000, elevationGainM: 2000, difficulty: 'very_hard' },
    review: { rating: 10 },
    visibility: 'private',
  }

  const originalActivityFind = Activity.find
  Activity.find = (filter) => {
    const matches = [publicActivity, privateActivity].filter(
      (a) =>
        (!filter.userId || filter.userId === 'user-1') &&
        (filter.visibility === undefined || a.visibility === filter.visibility)
    )
    // Mimic the chainable .select()/.sort()/.limit() calls used by the real
    // queries without needing a live connection.
    const chain = {
      select: () => chain,
      sort: () => chain,
      limit: () => chain,
      then: (resolve) => resolve(matches),
    }
    return chain
  }

  try {
    const stats = await getPublicStatistics('user-1')
    assert(stats.totals.activities === 2, 'Overall totals count BOTH activities (2), including the private one')
    assert(stats.totals.distanceKm === 108, 'distanceKm reflects the OVERALL total (108), not just the public 8')
    assert(stats.records.highestRating === 7, 'The highest-rated RECORD still reflects only the public activity (7, not the private 10)')
    assert(
      stats.records.highestRatedActivity?.id === 'act-public',
      'The record reference still points at the public activity, never the private one, even though it has a higher rating'
    )
    assert(
      JSON.stringify(stats).includes('Secret Long Hike') === false,
      "The private activity's name never appears anywhere in the statistics output, even now that its numbers count toward the totals"
    )
  } finally {
    Activity.find = originalActivityFind
  }

  console.log('')

  // Non-opted-in / nonexistent profile → 404, non-distinguishing.
  const originalUserFindOne = User.findOne
  User.findOne = async (filter) => {
    if (filter.username === 'public_user' && filter.isPublicProfile === true) {
      return { _id: 'user-1', username: 'public_user', name: 'Public User', bio: '', location: '' }
    }
    return null
  }
  Activity.find = () => ({
    select: function () { return this },
    sort: function () { return this },
    limit: function () { return this },
    populate: function () { return this },
    then: (resolve) => resolve([]),
  })

  try {
    const profile = await getPublicProfileByUsername('public_user')
    assert(profile.profile.username === 'public_user', 'An opted-in profile is returned')

    let threw404 = false
    let status = null
    try {
      await getPublicProfileByUsername('private_or_nonexistent_user')
    } catch (err) {
      threw404 = true
      status = err.status
    }
    assert(threw404 && status === 404, 'A non-opted-in or nonexistent username throws a 404')
  } finally {
    User.findOne = originalUserFindOne
    Activity.find = originalActivityFind
  }

  console.log(`\n${failures === 0 ? '✓ All M3 mocked unit checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
