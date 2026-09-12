// M8 — Following: mocked unit verification.
//
// Same sandbox limitation as M1-M7 (no MongoDB reachable here). Two parts:
// (1) followService in isolation, mocking User/Follow/Notification;
// (2) communityService.listPublicFeed's scope="following" integration,
// mocking Follow.find + Activity.find together (Activity.find reuses the
// same honest fixture-filtering approach as test-community-m4-unit.js).
// Property under test, per docs/08_COMMUNITY_PROPOSAL.md §6/§13 M8: cannot
// follow a non-public-profile user; cannot self-follow; cannot follow
// twice (idempotent, not an error — see followService.js for why this
// differs from Report's duplicate handling); unfollow is idempotent; the
// Following feed never exposes anything Explore wouldn't also show for
// the same user (i.e. it's still gated purely by Activity.visibility).
//
// Usage: node scripts/test-community-m8-unit.js

import { User } from '../src/models/User.js'
import { Follow } from '../src/models/Follow.js'
import { Activity } from '../src/models/Activity.js'
import { Notification } from '../src/models/Notification.js'
import { followUserByUsername, unfollowUserByUsername, isFollowing } from '../src/services/followService.js'
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

let users
let follows
let notifications

function resetFixtures() {
  users = [
    { _id: 'user-public-1', username: 'publichiker', isPublicProfile: true },
    { _id: 'user-public-2', username: 'anotherpublic', isPublicProfile: true },
    { _id: 'user-private-1', username: 'privatehiker', isPublicProfile: false },
  ]
  follows = []
  notifications = []
}

function installMocks() {
  User.findOne = (filter) => {
    const found = users.find(
      (u) => u.username === filter.username && (filter.isPublicProfile === undefined || u.isPublicProfile === filter.isPublicProfile)
    )
    return { select: () => Promise.resolve(found ? { ...found } : null) }
  }

  Follow.create = async (doc) => {
    const isDuplicate = follows.some((f) => f.followerId === doc.followerId && f.followingId === doc.followingId)
    if (isDuplicate) {
      const err = new Error('E11000 duplicate key error')
      err.code = 11000
      throw err
    }
    const created = { _id: `follow-${follows.length + 1}`, ...doc }
    follows.push(created)
    return created
  }

  Follow.exists = async (filter) => {
    const found = follows.some((f) => f.followerId === filter.followerId && f.followingId === filter.followingId)
    return found ? { _id: 'x' } : null
  }

  Follow.deleteOne = async (filter) => {
    const idx = follows.findIndex((f) => f.followerId === filter.followerId && f.followingId === filter.followingId)
    if (idx !== -1) follows.splice(idx, 1)
  }

  Follow.find = (filter) => {
    const matched = follows.filter((f) => f.followerId === filter.followerId)
    return { select: () => ({ lean: () => Promise.resolve(matched) }) }
  }

  Notification.create = async (doc) => {
    notifications.push(doc)
    return doc
  }
}

// Reused verbatim from test-community-m4-unit.js's approach: an honest
// in-memory fixture filter, not hand-coded expected results.
const activityFixture = [
  { _id: 'act-1', userId: 'user-public-1', name: 'Public 1 recent', visibility: 'public', date: new Date('2026-06-05') },
  { _id: 'act-2', userId: 'user-public-1', name: 'Public 1 older', visibility: 'private', date: new Date('2026-06-04') },
  { _id: 'act-3', userId: 'user-public-2', name: 'Public 2', visibility: 'public', date: new Date('2026-06-03') },
  { _id: 'act-4', userId: 'user-private-1', name: 'Not followed anyway', visibility: 'public', date: new Date('2026-06-02') },
]

function applyFilter(doc, filter) {
  for (const [key, value] of Object.entries(filter)) {
    const docValue = key.split('.').reduce((obj, k) => obj?.[k], doc)
    if (value && typeof value === 'object' && '$in' in value) {
      if (!value.$in.map(String).includes(String(docValue))) return false
    } else if (value instanceof RegExp) {
      if (!value.test(docValue ?? '')) return false
    } else {
      if (String(docValue) !== String(value)) return false
    }
  }
  return true
}

function installActivityFindMock() {
  Activity.find = (filter) => {
    const matched = activityFixture.filter((doc) => applyFilter(doc, filter))
    const sorted = [...matched].sort((a, b) => b.date - a.date)
    return {
      sort() {
        return this
      },
      limit(n) {
        return Promise.resolve(sorted.slice(0, n))
      },
    }
  }
}

async function run() {
  console.log('=== M8 — Following: mocked unit verification ===\n')
  installMocks()

  // 1. Following a private (non-public-profile) user is rejected (404).
  resetFixtures()
  try {
    await followUserByUsername('follower-1', 'privatehiker')
    assert(false, 'Following a non-public-profile user throws')
  } catch (err) {
    assert(err.status === 404, 'Following a non-public-profile user throws 404')
  }
  assert(follows.length === 0, 'No follow record was created for the rejected attempt')

  // 2. Following a nonexistent username is rejected (404).
  try {
    await followUserByUsername('follower-1', 'ghost-user')
    assert(false, 'Following a nonexistent user throws')
  } catch (err) {
    assert(err.status === 404, 'Following a nonexistent user throws 404')
  }

  // 3. Self-follow is rejected (422).
  try {
    await followUserByUsername('user-public-1', 'publichiker')
    assert(false, 'Self-following throws')
  } catch (err) {
    assert(err.status === 422, 'Self-following throws 422')
  }
  assert(follows.length === 0, 'No follow record was created for the self-follow attempt')

  // 4. A genuine follow succeeds and notifies the followed user.
  const result = await followUserByUsername('follower-1', 'publichiker')
  assert(result.isFollowing === true, 'A successful follow reports isFollowing: true')
  assert(follows.length === 1, 'Exactly one follow record was created')
  assert(notifications.length === 1, 'Exactly one notification was created')
  assert(notifications[0].recipientUserId === 'user-public-1', 'The notification goes to the followed user')
  assert(notifications[0].type === 'follow', 'The notification has type "follow"')

  // 5. Following the same user again is idempotent — not an error, no
  //    second record, no second notification.
  const secondAttempt = await followUserByUsername('follower-1', 'publichiker')
  assert(secondAttempt.isFollowing === true, 'Following the same user twice still reports isFollowing: true')
  assert(follows.length === 1, 'Following twice does not create a second follow record')
  assert(notifications.length === 1, 'Following twice does not create a second notification')

  // 6. isFollowing() reflects reality directly.
  assert((await isFollowing('follower-1', 'user-public-1')) === true, 'isFollowing() is true after a successful follow')
  assert((await isFollowing('follower-2', 'user-public-1')) === false, 'isFollowing() is false for an unrelated user')
  assert((await isFollowing(undefined, 'user-public-1')) === false, 'isFollowing() is false (not an error) for an anonymous viewer')

  // 7. Unfollow removes the record.
  const unfollowResult = await unfollowUserByUsername('follower-1', 'publichiker')
  assert(unfollowResult.isFollowing === false, 'Unfollowing reports isFollowing: false')
  assert(follows.length === 0, 'The follow record was removed')

  // 8. Unfollowing is idempotent — unfollowing someone you don't follow
  //    (or who doesn't exist) is a safe no-op, not an error.
  const idempotentUnfollow = await unfollowUserByUsername('follower-1', 'publichiker')
  assert(idempotentUnfollow.isFollowing === false, 'Unfollowing an already-unfollowed user is a safe no-op')

  const unfollowGhost = await unfollowUserByUsername('follower-1', 'ghost-user')
  assert(unfollowGhost.isFollowing === false, 'Unfollowing a nonexistent username is a safe no-op, not an error')

  // 9. Following-feed integration: scope="following" with no viewer is
  //    rejected (401) — a following feed has no meaning for an anonymous
  //    request.
  resetFixtures()
  installActivityFindMock()
  try {
    await listPublicFeed({ scope: 'following' })
    assert(false, 'scope="following" with no viewer throws')
  } catch (err) {
    assert(err.status === 401, 'scope="following" with no authenticated viewer throws 401')
  }

  // 10. With a real viewer following user-public-1 only, the following
  //     feed shows exactly that user's PUBLIC activities — never their
  //     private ones, and never an unrelated (unfollowed) user's, even
  //     though that unrelated user's activity is also public (proving
  //     this is genuinely scoped to the follow list, not just to
  //     visibility like Explore).
  follows.push({ followerId: 'follower-1', followingId: 'user-public-1' })
  const feed = await listPublicFeed({ scope: 'following', viewerUserId: 'follower-1' })
  assert(feed.activities.length === 1, 'The following feed returns exactly one activity')
  assert(feed.activities[0].name === 'Public 1 recent', 'The following feed shows only the followed user\'s public activity')
  assert(
    feed.activities.every((a) => a.name !== 'Public 1 older'),
    "The followed user's PRIVATE activity never appears, even in their follower's feed"
  )
  assert(
    feed.activities.every((a) => a.name !== 'Public 2'),
    "A public activity from a user who ISN'T followed never appears in the following feed"
  )

  // 11. Following nobody produces an empty feed, not an error.
  follows.length = 0
  const emptyFeed = await listPublicFeed({ scope: 'following', viewerUserId: 'follower-1' })
  assert(emptyFeed.activities.length === 0, 'Following nobody produces an empty feed rather than an error or the full Explore feed')

  console.log(`\n${failures === 0 ? '✓ All M8 mocked unit checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
