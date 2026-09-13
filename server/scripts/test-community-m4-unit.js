// M4 — Explore Feed: mocked unit verification.
//
// Same sandbox limitation as M1-M3 (no MongoDB reachable here) — stubs
// Activity.find directly. The property under test, per
// docs/08_COMMUNITY_PROPOSAL.md §13 M4: private activities never appear in
// the feed regardless of filters, and pagination's hasMore/nextCursor logic
// doesn't skip or duplicate across pages.
//
// Usage: node scripts/test-community-m4-unit.js

import { Activity } from '../src/models/Activity.js'
import { User } from '../src/models/User.js'
import { listPublicFeed } from '../src/services/communityService.js'

let failures = 0

function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`)
    failures += 1
  } else {
    console.log(`✓ ${message}`)
  }
}

// A small in-memory fixture "collection" so the stub can honestly apply
// filter/sort/limit semantics rather than hand-coding expected results.
const fixture = [
  { _id: 'a5', userId: 'u5', name: 'Public Oran Hike', type: 'hiking', location: { wilaya: 'Oran' }, visibility: 'public', date: new Date('2026-05-05') },
  { _id: 'a4', userId: 'u4', name: 'Private Oran Hike', type: 'hiking', location: { wilaya: 'Oran' }, visibility: 'private', date: new Date('2026-05-04') },
  { _id: 'a3', userId: 'u3', name: 'Public Blida Trek', type: 'trekking', location: { wilaya: 'Blida' }, visibility: 'public', date: new Date('2026-05-03') },
  { _id: 'a2', userId: 'u2', name: 'Public Oran Camp', type: 'camping', location: { wilaya: 'Oran' }, visibility: 'public', date: new Date('2026-05-02') },
  { _id: 'a1', userId: 'u1', name: 'Public Old Hike', type: 'hiking', location: { wilaya: 'Oran' }, visibility: 'public', date: new Date('2026-05-01') },
]

function applyFilter(doc, filter) {
  for (const [key, value] of Object.entries(filter)) {
    if (key === '$or') {
      const matchesAny = value.some((clause) => applyFilter(doc, clause))
      if (!matchesAny) return false
      continue
    }
    const docValue = key.split('.').reduce((obj, k) => obj?.[k], doc)
    if (value instanceof RegExp) {
      if (!value.test(docValue ?? '')) return false
    } else if (value && typeof value === 'object' && ('$lt' in value)) {
      if (!(docValue < value.$lt)) return false
    } else if (value && typeof value === 'object' && !(value instanceof Date)) {
      // e.g. { date: <Date> } equality inside an $or clause — handled below
      if (String(docValue) !== String(value)) return false
    } else {
      if (String(docValue) !== String(value)) return false
    }
  }
  return true
}

const originalFind = Activity.find
Activity.find = (filter) => {
  const matched = fixture.filter((doc) => applyFilter(doc, filter))
  const sorted = [...matched].sort((a, b) => b.date - a.date || (a._id < b._id ? 1 : -1))
  const chain = {
    _limit: undefined,
    sort() {
      return this
    },
    limit(n) {
      this._limit = n
      return this
    },
    populate() {
      return this
    },
    then(resolve) {
      resolve(this._limit ? sorted.slice(0, this._limit) : sorted)
    },
  }
  return chain
}

// resolvePublicAuthor queries User directly — stub it to a simple
// opted-in author so this test stays focused on feed filtering/pagination,
// not the author-resolution behavior (which M8's test covers directly).
User.findById = () => ({
  select: () => ({ lean: () => Promise.resolve({ name: 'Fixture Author', username: 'fixtureauthor', isPublicProfile: true }) }),
})

async function run() {
  console.log('=== M4 — Explore Feed: mocked unit verification ===\n')

  try {
    const page1 = await listPublicFeed({ limit: 2 })
    assert(page1.activities.length === 2, 'First page returns exactly `limit` items (2)')
    assert(page1.activities.every((a) => a.name !== 'Private Oran Hike'), 'The private activity never appears with no filters')
    assert(page1.nextCursor != null, 'A nextCursor is returned when more pages exist')

    const page2 = await listPublicFeed({ limit: 2, cursor: page1.nextCursor })
    const page1Ids = new Set(page1.activities.map((a) => String(a.id)))
    const page2Ids = new Set(page2.activities.map((a) => String(a.id)))
    const overlap = [...page1Ids].filter((id) => page2Ids.has(id))
    assert(overlap.length === 0, 'Page 2 does not repeat any id already seen on page 1 (no duplicates across pages)')
    assert(page2.activities.every((a) => a.name !== 'Private Oran Hike'), 'The private activity never appears on page 2 either')

    const oranFiltered = await listPublicFeed({ wilaya: 'oran', limit: 10 })
    assert(
      oranFiltered.activities.every((a) => a.name !== 'Private Oran Hike'),
      'Filtering by wilaya="oran" still never returns the private Oran activity'
    )
    assert(oranFiltered.activities.length === 3, 'Exactly the 3 public Oran activities are returned (not the private 4th)')

    const typeFiltered = await listPublicFeed({ type: 'hiking', limit: 10 })
    assert(
      typeFiltered.activities.every((a) => a.name !== 'Private Oran Hike'),
      'Filtering by type="hiking" still never returns the private hiking activity'
    )

    // NOTE: scope="following" was a hard 422 reject when M4 first shipped
    // (Follow didn't exist yet). M8 implements it for real — this
    // assertion is intentionally updated to match: an unauthenticated
    // request for scope="following" now fails with 401 (real auth
    // required), not 422. A genuinely unknown scope value still gets 422.
    // See test-community-m8-unit.js for full scope="following" coverage.
    let rejectedFollowingNoViewer = false
    try {
      await listPublicFeed({ scope: 'following' })
    } catch (err) {
      rejectedFollowingNoViewer = err.status === 401
    }
    assert(rejectedFollowingNoViewer, 'scope="following" with no authenticated viewer is rejected with 401 (not silently treated as Explore)')

    let rejectedUnknownScope = false
    try {
      await listPublicFeed({ scope: 'trending' })
    } catch (err) {
      rejectedUnknownScope = err.status === 422
    }
    assert(rejectedUnknownScope, 'A genuinely unknown scope value is rejected with 422')
  } finally {
    Activity.find = originalFind
  }

  console.log(`\n${failures === 0 ? '✓ All M4 mocked unit checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
