// M2 — Public Activity View: mocked unit verification.
//
// This sandbox has no MongoDB reachable (same limitation noted at M1), so
// this script stubs Activity.findOne directly rather than hitting a real
// database, to verify getPublicActivityById's core logic: it must query
// with `visibility: 'public'` as part of the filter (not fetch-then-check),
// and it must throw a non-distinguishing 404 — not merely "not found" vs.
// "found but private" — when nothing matches.
//
// This does NOT replace scripts/test-community-public-activity.sh, which
// exercises the real HTTP + database path end to end and should be run
// against an actual dev environment before this milestone is considered
// verified.
//
// Usage: node scripts/test-community-m2-unit.js

import { Activity } from '../src/models/Activity.js'
import { getPublicActivityById } from '../src/services/communityService.js'

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
  console.log('=== M2 — Public Activity View: mocked unit verification ===\n')

  const fixturePublicActivity = {
    _id: 'act-public-1',
    userId: 'author-1',
    name: 'Chréa Winter Trek',
    type: 'trekking',
    date: new Date('2026-01-10'),
    location: { placeName: 'Chréa', wilaya: 'Blida', country: 'Algeria', latitude: 36.42, longitude: 2.88 },
    trail: { distanceKm: 8.2, durationMinutes: 200, maxAltitudeM: 1500, elevationGainM: 500, elevationLossM: 500, difficulty: 'moderate' },
    conditions: { weather: 'snowy', temperatureC: -2, trailCondition: 'snowy' },
    social: { groupId: null, companions: ['Private Friend'] },
    costDzd: 1500,
    review: { rating: 8, challenges: 'Cold wind at the summit', notes: 'PRIVATE NOTES' },
    destinationId: null,
    gearItemIds: [],
    visibility: 'public',
    publicCaption: 'First snow trek of the season.',
    kudosCount: 0,
    createdAt: new Date(),
  }

  // Stub findOne to behave like a real query filtered by { _id, visibility: 'public' }:
  // only returns the fixture if BOTH conditions are met, exactly mirroring what a
  // real MongoDB query would do — this is what proves the service filters at the
  // query level rather than fetching first and checking visibility in JS after.
  const originalFindOne = Activity.findOne
  Activity.findOne = async (filter) => {
    if (filter._id === 'act-public-1' && filter.visibility === 'public') {
      return fixturePublicActivity
    }
    return null
  }

  try {
    const publicResult = await getPublicActivityById('act-public-1')
    assert(publicResult.name === 'Chréa Winter Trek', 'Public activity is returned with its public fields')
    assert(publicResult.review.notes === undefined, 'review.notes key is absent from the result')
    assert(JSON.stringify(publicResult).includes('Private Friend') === false, 'companion name never appears')

    let threw404 = false
    let status = null
    let code = null
    try {
      await getPublicActivityById('act-private-or-missing-1')
    } catch (err) {
      threw404 = true
      status = err.status
      code = err.code
    }
    assert(threw404, 'A private-or-nonexistent id throws')
    assert(status === 404, 'The thrown error has status 404')
    assert(code === 'NOT_FOUND', "The thrown error's code is NOT_FOUND (non-distinguishing — same as any other missing resource)")

    console.log(`\n${failures === 0 ? '✓ All M2 mocked unit checks passed.' : `✗ ${failures} check(s) failed.`}`)
  } finally {
    Activity.findOne = originalFindOne
  }

  process.exit(failures === 0 ? 0 : 1)
}

run()
