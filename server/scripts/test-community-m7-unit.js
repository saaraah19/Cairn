// M7 — Reporting: mocked unit verification.
//
// Same sandbox limitation as M1-M6 (no MongoDB reachable here). Stubs the
// model calls with an in-memory fixture, including a fake unique-index
// violation on a duplicate insert (mirroring Mongo's err.code === 11000).
// Property under test, per docs/08_COMMUNITY_PROPOSAL.md §7/§13 M7:
// self-reporting rejected; reporting a private/nonexistent target
// rejected; duplicate report from the same user on the same target
// rejected (NOT idempotent, unlike Kudos); both target types (activity,
// comment) work; a comment's report resolves ownership to the comment's
// author, not the activity owner; different reporters on the same target
// do not collide with each other.
//
// Usage: node scripts/test-community-m7-unit.js

import { Activity } from '../src/models/Activity.js'
import { Comment } from '../src/models/Comment.js'
import { Report } from '../src/models/Report.js'
import { createReport } from '../src/services/reportService.js'

let failures = 0
function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`)
    failures += 1
  } else {
    console.log(`✓ ${message}`)
  }
}

let activities
let comments
let reports
let reportIdCounter

function resetFixtures() {
  activities = [
    { _id: 'act-public', userId: 'owner-1', visibility: 'public' },
    { _id: 'act-private', userId: 'owner-2', visibility: 'private' },
  ]
  comments = [
    { _id: 'comment-on-public', userId: 'commenter-1', activityId: 'act-public' },
    { _id: 'comment-on-private', userId: 'commenter-2', activityId: 'act-private' },
  ]
  reports = []
  reportIdCounter = 1
}

function installMocks() {
  Activity.findOne = (filter) => {
    const found = activities.find(
      (a) => a._id === filter._id && (filter.visibility === undefined || a.visibility === filter.visibility)
    )
    return { select: () => Promise.resolve(found ? { ...found } : null) }
  }

  Comment.findById = (id) => {
    const found = comments.find((c) => c._id === id)
    return { select: () => Promise.resolve(found ? { ...found } : null) }
  }

  Report.create = async (doc) => {
    const isDuplicate = reports.some(
      (r) =>
        r.reporterUserId === doc.reporterUserId &&
        r.targetType === doc.targetType &&
        r.targetId === doc.targetId
    )
    if (isDuplicate) {
      const err = new Error('E11000 duplicate key error')
      err.code = 11000
      throw err
    }
    const created = { _id: `report-${reportIdCounter++}`, status: 'open', ...doc }
    reports.push(created)
    return created
  }
}

async function run() {
  console.log('=== M7 — Reporting: mocked unit verification ===\n')
  installMocks()

  // 1. Reporting a nonexistent/private activity is rejected (404) — same
  //    "never trust an earlier read" rule as every other public path.
  resetFixtures()
  try {
    await createReport('user-x', 'activity', 'act-private', 'spam')
    assert(false, 'Reporting a private activity throws')
  } catch (err) {
    assert(err.status === 404, 'Reporting a private activity throws 404')
  }
  assert(reports.length === 0, 'No report was created for the rejected attempt')

  try {
    await createReport('user-x', 'activity', 'act-does-not-exist', 'spam')
    assert(false, 'Reporting a nonexistent activity throws')
  } catch (err) {
    assert(err.status === 404, 'Reporting a nonexistent activity throws 404')
  }

  // 2. Self-reporting an activity is rejected (422).
  try {
    await createReport('owner-1', 'activity', 'act-public', 'spam')
    assert(false, 'Self-reporting an activity throws')
  } catch (err) {
    assert(err.status === 422, 'Self-reporting an activity throws 422, not silently accepted')
  }
  assert(reports.length === 0, 'No report was created for the self-report attempt')

  // 3. A genuine report of another user's public activity succeeds.
  const activityReport = await createReport('reporter-1', 'activity', 'act-public', 'spam')
  assert(activityReport.status === 'open', 'A new activity report is created with status "open"')
  assert(reports.length === 1, 'Exactly one report was persisted')

  // 4. A duplicate report (same reporter, same target) is rejected — NOT
  //    treated as an idempotent success, unlike Kudos.
  try {
    await createReport('reporter-1', 'activity', 'act-public', 'harassment')
    assert(false, 'A duplicate report throws')
  } catch (err) {
    assert(err.status === 409, 'A duplicate report from the same user on the same target throws 409')
    assert(err.code === 'ALREADY_REPORTED', 'The duplicate-report error uses the ALREADY_REPORTED code')
  }
  assert(reports.length === 1, 'The duplicate attempt did not create a second report')

  // 5. A different reporter on the SAME target does not collide with #3.
  const secondReporter = await createReport('reporter-2', 'activity', 'act-public', 'other')
  assert(secondReporter.status === 'open', 'A different user reporting the same activity succeeds independently')
  assert(reports.length === 2, 'Two distinct reporters produced two distinct report records')

  // 6. Reporting a comment resolves ownership to the COMMENT's author, not
  //    the activity owner — the activity owner can validly report a
  //    comment on their own public activity.
  const commentReport = await createReport('owner-1', 'comment', 'comment-on-public', 'inappropriate_content')
  assert(commentReport.status === 'open', "The activity owner can report someone else's comment on their own activity")

  // 7. Self-reporting a comment (by its own author) is rejected.
  try {
    await createReport('commenter-1', 'comment', 'comment-on-public', 'spam')
    assert(false, 'Self-reporting a comment throws')
  } catch (err) {
    assert(err.status === 422, 'Self-reporting a comment throws 422')
  }

  // 8. Reporting a comment whose parent activity has since gone private is
  //    rejected (404), even though the Comment document itself still
  //    exists — matches commentService's existing re-verification rule.
  try {
    await createReport('user-x', 'comment', 'comment-on-private', 'spam')
    assert(false, 'Reporting a comment on a now-private activity throws')
  } catch (err) {
    assert(err.status === 404, 'Reporting a comment on a now-private activity throws 404')
  }

  // 9. Reporting a nonexistent comment is rejected (404).
  try {
    await createReport('user-x', 'comment', 'comment-does-not-exist', 'spam')
    assert(false, 'Reporting a nonexistent comment throws')
  } catch (err) {
    assert(err.status === 404, 'Reporting a nonexistent comment throws 404')
  }

  console.log(`\n${failures === 0 ? '✓ All M7 mocked unit checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
