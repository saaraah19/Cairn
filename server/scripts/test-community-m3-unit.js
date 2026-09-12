// M3 — Public Profiles: mocked unit verification.
//
// Same sandbox limitation as M1/M2 (no MongoDB reachable here) — this
// stubs the model calls directly. The critical property under test is the
// one the proposal calls out explicitly: public profile statistics must
// reflect ONLY public activities, never the user's real totals, even
// though this user also has private activities in the fixture data.
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

  // A user with 1 public activity (8km) and 1 private activity (100km).
  // If scoping is broken, totals.distanceKm would be 108, not 8.
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
      (a) => a.visibility === filter.visibility && (!filter.userId || filter.userId === 'user-1')
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
    assert(stats.totals.activities === 1, 'Only the public activity is counted (1, not 2)')
    assert(stats.totals.distanceKm === 8, 'distanceKm reflects only the public activity (8, not 108)')
    assert(stats.records.highestRating === 7, 'highestRating reflects only the public activity (7, not the private 10)')
    assert(
      stats.records.highestRatedActivity?.id === 'act-public',
      'The record reference points at the public activity, not the private one'
    )
    assert(
      JSON.stringify(stats).includes('Secret Long Hike') === false,
      "The private activity's name never appears in the statistics output"
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
