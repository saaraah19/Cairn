// M5 — Kudos: mocked unit verification.
//
// Same sandbox limitation as M1-M4 (no MongoDB reachable here). This test
// builds a small in-memory fixture "database" (plain arrays, not real
// Mongoose queries) and overrides each model static kudosService.js
// actually calls, so the atomicity/idempotency logic itself — not Mongo's
// query engine — is what's under test. This is the milestone the proposal
// specifically calls out as needing careful concurrency verification
// (docs/08_COMMUNITY_PROPOSAL.md §13, M5).
//
// Usage: node scripts/test-community-m5-unit.js

import { Activity } from '../src/models/Activity.js'
import { Kudos } from '../src/models/Kudos.js'
import { Notification } from '../src/models/Notification.js'
import { giveKudos, removeKudos, hasUserGivenKudos } from '../src/services/kudosService.js'

let failures = 0
function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`)
    failures += 1
  } else {
    console.log(`✓ ${message}`)
  }
}

// --- In-memory fixture "database" ---
let activities
let kudosDocs
let notifications

function resetFixtures() {
  activities = [
    { _id: 'act-public', userId: 'author-1', visibility: 'public', kudosCount: 0 },
    { _id: 'act-private', userId: 'author-2', visibility: 'private', kudosCount: 0 },
  ]
  kudosDocs = []
  notifications = []
}

function selectable(value) {
  return { select: () => ({ then: (resolve) => resolve(value) }), then: (resolve) => resolve(value) }
}

function installMocks() {
  Activity.findOne = (filter) => {
    const found = activities.find(
      (a) => a._id === filter._id && (filter.visibility === undefined || a.visibility === filter.visibility)
    )
    return selectable(found ? { ...found } : null)
  }

  Activity.findById = (id) => selectable(activities.find((a) => a._id === id) ? { ...activities.find((a) => a._id === id) } : null)

  Activity.findOneAndUpdate = (filter, update) => {
    const activity = activities.find((a) => {
      if (a._id !== filter._id) return false
      if (filter.visibility !== undefined && a.visibility !== filter.visibility) return false
      if (filter.kudosCount && filter.kudosCount.$gt !== undefined && !(a.kudosCount > filter.kudosCount.$gt)) return false
      return true
    })
    if (!activity) return selectable(null)
    if (update.$inc?.kudosCount) activity.kudosCount += update.$inc.kudosCount
    return selectable({ ...activity })
  }

  Kudos.create = async (doc) => {
    const dup = kudosDocs.find((k) => k.activityId === doc.activityId && k.userId === doc.userId)
    if (dup) {
      const err = new Error('duplicate key')
      err.code = 11000
      throw err
    }
    const created = { _id: `kudos-${kudosDocs.length + 1}`, ...doc }
    kudosDocs.push(created)
    return created
  }

  Kudos.findOneAndDelete = async (filter) => {
    const idx = kudosDocs.findIndex((k) => k.activityId === filter.activityId && k.userId === filter.userId)
    if (idx === -1) return null
    const [removed] = kudosDocs.splice(idx, 1)
    return removed
  }

  Kudos.deleteOne = async (filter) => {
    const idx = kudosDocs.findIndex((k) => k._id === filter._id)
    if (idx !== -1) kudosDocs.splice(idx, 1)
  }

  Kudos.exists = async (filter) => kudosDocs.some((k) => k.activityId === filter.activityId && k.userId === filter.userId)

  Notification.create = async (doc) => {
    notifications.push(doc)
    return doc
  }
}

async function run() {
  console.log('=== M5 — Kudos: mocked unit verification ===\n')
  installMocks()

  // 1. Kudos on a private activity is rejected.
  resetFixtures()
  try {
    await giveKudos('viewer-1', 'act-private')
    assert(false, 'Kudos on a private activity throws')
  } catch (err) {
    assert(err.status === 404, 'Kudos on a private activity throws a 404')
  }

  // 2. Self-kudos is rejected.
  resetFixtures()
  try {
    await giveKudos('author-1', 'act-public')
    assert(false, 'Self-kudos throws')
  } catch (err) {
    assert(err.status === 422, 'Self-kudos throws a 422, not silently accepted')
  }
  assert(kudosDocs.length === 0, 'No Kudos document was created for the rejected self-kudos attempt')

  // 3. A genuine first-time give increments the counter and notifies once.
  resetFixtures()
  const firstGive = await giveKudos('viewer-1', 'act-public')
  assert(firstGive.kudosCount === 1, 'First give results in kudosCount = 1')
  assert(firstGive.hasKudos === true, 'Response reports hasKudos: true')
  assert(notifications.length === 1, 'Exactly one notification was created')
  assert(notifications[0].type === 'kudos', 'The notification has type "kudos"')

  // 4. A duplicate give from the same user is an idempotent no-op: no
  //    second Kudos document, no second counter increment, no second
  //    notification.
  const duplicateGive = await giveKudos('viewer-1', 'act-public')
  assert(duplicateGive.kudosCount === 1, 'Duplicate give leaves kudosCount at 1, not 2')
  assert(kudosDocs.length === 1, 'Still exactly one Kudos document after the duplicate attempt')
  assert(notifications.length === 1, 'Still exactly one notification after the duplicate attempt')

  // 5. "Concurrent" gives from the same user: fire both before either
  //    resolves, and confirm only one actually incremented the counter —
  //    this exercises the exact race the unique index exists to prevent.
  resetFixtures()
  const [concurrentA, concurrentB] = await Promise.all([
    giveKudos('viewer-2', 'act-public').catch((e) => e),
    giveKudos('viewer-2', 'act-public').catch((e) => e),
  ])
  const finalCount = activities.find((a) => a._id === 'act-public').kudosCount
  assert(finalCount === 1, 'Two concurrent give requests from the same user produce exactly one counter increment')
  assert(kudosDocs.length === 1, 'Exactly one Kudos document exists after the concurrent attempt')
  assert(
    [concurrentA, concurrentB].some((r) => r.kudosCount === 1),
    'At least one of the two concurrent responses reports the correct final count'
  )

  // 6. Different users giving kudos to the same activity both count.
  const secondUserGive = await giveKudos('viewer-3', 'act-public')
  assert(secondUserGive.kudosCount === 2, 'A second, different user giving kudos increments to 2')

  // 7. Remove is idempotent and never goes negative.
  await removeKudos('viewer-2', 'act-public')
  await removeKudos('viewer-3', 'act-public')
  const afterRemoves = activities.find((a) => a._id === 'act-public').kudosCount
  assert(afterRemoves === 0, 'Removing both kudos brings the count back to 0')
  const overRemove = await removeKudos('viewer-2', 'act-public') // already removed above
  assert(overRemove.kudosCount === 0, 'Removing an already-removed kudos is a no-op, not an error')
  assert(overRemove.kudosCount >= 0, 'The counter never goes negative')

  // 8. hasUserGivenKudos reflects current state and handles no viewer.
  assert((await hasUserGivenKudos(undefined, 'act-public')) === false, 'hasUserGivenKudos is false for an anonymous (undefined) viewer')
  await giveKudos('viewer-4', 'act-public')
  assert((await hasUserGivenKudos('viewer-4', 'act-public')) === true, 'hasUserGivenKudos is true after a real give')
  assert((await hasUserGivenKudos('viewer-5', 'act-public')) === false, "hasUserGivenKudos is false for a user who hasn't given kudos")

  console.log(`\n${failures === 0 ? '✓ All M5 mocked unit checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
