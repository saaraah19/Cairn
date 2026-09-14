// M6 — Comments: mocked unit verification.
//
// Same sandbox limitation as M1-M5 (no MongoDB reachable here). Stubs the
// model calls with an in-memory fixture. Property under test, per
// docs/08_COMMUNITY_PROPOSAL.md §13 M6: comment write/read blocked on
// private activities; only author or activity owner can delete; only
// author can edit; deletion by an unrelated user rejected.
//
// Usage: node scripts/test-community-m6-unit.js

import { Activity } from '../src/models/Activity.js'
import { Comment } from '../src/models/Comment.js'
import { CommentLike } from '../src/models/CommentLike.js'
import { Notification } from '../src/models/Notification.js'
import { listComments, createComment, updateComment, deleteComment, assertCanDeleteComment } from '../src/services/commentService.js'

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
let notifications
let commentIdCounter

function resetFixtures() {
  activities = [
    { _id: 'act-public', userId: 'owner-1', visibility: 'public', commentsCount: 0 },
    { _id: 'act-private', userId: 'owner-2', visibility: 'private', commentsCount: 0 },
  ]
  comments = []
  notifications = []
  commentIdCounter = 1
}

function installMocks() {
  Activity.findOne = (filter) => {
    const found = activities.find(
      (a) => a._id === filter._id && (filter.visibility === undefined || a.visibility === filter.visibility)
    )
    return { select: () => ({ then: (resolve) => resolve(found ? { ...found } : null) }) }
  }
  Activity.findById = (id) => {
    const found = activities.find((a) => a._id === id)
    return { select: () => ({ then: (resolve) => resolve(found ? { ...found } : null) }) }
  }
  // commentService now keeps Activity.commentsCount in sync on create/
  // delete — not what M6 tests, so these just need to exist and behave
  // reasonably without touching a real database.
  Activity.findByIdAndUpdate = async (id, update) => {
    const activity = activities.find((a) => a._id === id)
    if (activity && update.$inc?.commentsCount) activity.commentsCount += update.$inc.commentsCount
    return activity ? { ...activity } : null
  }
  Activity.findOneAndUpdate = async (filter, update) => {
    const activity = activities.find((a) => a._id === filter._id)
    if (!activity) return null
    if (filter.commentsCount && activity.commentsCount < filter.commentsCount.$gte) return null
    if (update.$inc?.commentsCount) activity.commentsCount += update.$inc.commentsCount
    return { ...activity }
  }

  Comment.create = async (doc) => {
    const created = {
      _id: `comment-${commentIdCounter++}`,
      ...doc,
      editedAt: null,
      createdAt: new Date(),
      populate: async function () {
        return this
      },
      save: async function () {
        const idx = comments.findIndex((c) => c._id === this._id)
        if (idx !== -1) comments[idx] = { ...this }
      },
    }
    comments.push(created)
    return created
  }
  Comment.findById = (id) => {
    const found = comments.find((c) => c._id === id)
    const result = found ? { ...found, save: found.save, populate: async function () { return this } } : null
    // Dual-usage: some call sites (createComment's reply-parent lookup)
    // chain .select(); others (updateComment/deleteComment) await the
    // result directly as if it were a full document. Supporting both
    // without a real Mongoose connection needs this shape.
    return {
      select: () => Promise.resolve(result),
      then: (resolve) => resolve(result),
    }
  }
  Comment.find = (filter) => {
    const matched = comments.filter(
      (c) =>
        (filter.activityId === undefined || c.activityId === filter.activityId) &&
        (filter.parentCommentId === undefined ||
          (filter.parentCommentId === null ? c.parentCommentId === null : c.parentCommentId === filter.parentCommentId))
    )
    // Every method returns the same chainable object so it works whether
    // called as .sort().limit().populate() (listComments' top-level query)
    // or just .sort().populate() with no .limit() (listReplies' query).
    const chain = {
      sort: () => chain,
      limit: () => chain,
      populate: () => chain,
      then: (resolve) => resolve(matched),
    }
    return chain
  }
  Comment.deleteOne = async (filter) => {
    const idx = comments.findIndex((c) => c._id === filter._id)
    if (idx !== -1) comments.splice(idx, 1)
  }
  // Now functional (previously a no-op, from before this file's new
  // commentsCount-on-delete scenario actually created a real reply).
  Comment.deleteMany = async (filter) => {
    comments = comments.filter((c) => c.parentCommentId !== filter.parentCommentId)
  }
  Comment.countDocuments = async (filter) => comments.filter((c) => c.parentCommentId === filter.parentCommentId).length

  // toCommentDTO calls hasUserLikedComment for every comment/reply it
  // builds — likes aren't what M6 tests, so this just needs to exist and
  // return false without touching a real database.
  CommentLike.exists = async () => null

  Notification.create = async (doc) => {
    notifications.push(doc)
    return doc
  }
}

async function run() {
  console.log('=== M6 — Comments: mocked unit verification ===\n')
  installMocks()

  // 1. Comment creation is blocked on a private activity.
  resetFixtures()
  try {
    await createComment('user-x', 'act-private', 'Nice hike!')
    assert(false, 'Creating a comment on a private activity throws')
  } catch (err) {
    assert(err.status === 404, 'Creating a comment on a private activity throws 404')
  }
  assert(comments.length === 0, 'No comment was created for the rejected attempt')

  // 2. Reading comments is blocked on a private activity.
  try {
    await listComments('act-private')
    assert(false, 'Listing comments on a private activity throws')
  } catch (err) {
    assert(err.status === 404, 'Listing comments on a private activity throws 404')
  }

  // 3. A comment on a public activity succeeds and notifies the owner (not the commenter).
  resetFixtures()
  const created = await createComment('commenter-1', 'act-public', 'Great trail conditions!')
  assert(created.text === 'Great trail conditions!', 'Comment is created with the given text')
  assert(notifications.length === 1, 'Exactly one notification was created')
  assert(notifications[0].recipientUserId === 'owner-1', 'The notification goes to the activity owner')
  assert(notifications[0].type === 'comment', 'The notification has type "comment"')

  // 4. The activity owner commenting on their own activity does NOT self-notify.
  await createComment('owner-1', 'act-public', 'Thanks for reading!')
  assert(notifications.length === 1, "The owner commenting on their own activity doesn't create a self-notification")

  // 5. Only the author can edit; an unrelated user (even the activity owner) cannot.
  const editByAuthor = await updateComment('commenter-1', created.id, 'Great trail conditions, updated!')
  assert(editByAuthor.text === 'Great trail conditions, updated!', 'The author can edit their own comment')
  assert(editByAuthor.editedAt !== null, 'editedAt is set after an edit')

  let ownerEditRejected = false
  try {
    await updateComment('owner-1', created.id, 'Hijacked text')
  } catch (err) {
    ownerEditRejected = err.status === 403
  }
  assert(ownerEditRejected, 'The activity owner CANNOT edit someone else\'s comment (403) — edit rights are author-only')

  // 6. Delete rights: author can delete their own comment.
  const secondComment = await createComment('commenter-2', 'act-public', 'Temporary comment')
  await deleteComment('commenter-2', secondComment.id)
  assert(comments.find((c) => c._id === secondComment.id) === undefined, 'The author successfully deleted their own comment')

  // 7. Delete rights: the activity owner CAN delete a comment on their own activity.
  const thirdComment = await createComment('commenter-3', 'act-public', 'Another comment')
  await deleteComment('owner-1', thirdComment.id)
  assert(comments.find((c) => c._id === thirdComment.id) === undefined, 'The activity owner successfully deleted a comment on their own activity')

  // 8. Delete rights: an unrelated user (neither author nor activity owner) is rejected.
  const fourthComment = await createComment('commenter-4', 'act-public', 'Yet another comment')
  let unrelatedDeleteRejected = false
  try {
    await deleteComment('random-user', fourthComment.id)
  } catch (err) {
    unrelatedDeleteRejected = err.status === 403
  }
  assert(unrelatedDeleteRejected, 'An unrelated user cannot delete someone else\'s comment (403)')
  assert(comments.find((c) => c._id === fourthComment.id) !== undefined, 'The comment still exists after the rejected delete attempt')

  // 9. assertCanDeleteComment as a direct unit, matching the exact helper
  //    name documented in docs/08_COMMUNITY_PROPOSAL.md §5.
  const fixtureComment = { userId: 'author-x' }
  const fixtureActivity = { userId: 'owner-x' }
  let threwForStranger = false
  try {
    assertCanDeleteComment('stranger', fixtureComment, fixtureActivity)
  } catch {
    threwForStranger = true
  }
  assert(threwForStranger, 'assertCanDeleteComment rejects a stranger directly')
  assertCanDeleteComment('author-x', fixtureComment, fixtureActivity) // should not throw
  assertCanDeleteComment('owner-x', fixtureComment, fixtureActivity) // should not throw
  assert(true, 'assertCanDeleteComment allows both the author and the activity owner without throwing')

  // 10. Activity.commentsCount stays in sync with actual comment/reply
  // create and delete, including the cascade-delete case.
  resetFixtures()
  const activityRef = activities.find((a) => a._id === 'act-public')
  const parent = await createComment('commenter-1', 'act-public', 'Parent comment')
  assert(activityRef.commentsCount === 1, 'commentsCount increments to 1 after a top-level comment is created')
  await createComment('commenter-2', 'act-public', 'A reply', parent.id)
  assert(activityRef.commentsCount === 2, 'commentsCount increments again for a reply (counts conversation size, not just top-level threads)')
  await deleteComment('commenter-1', parent.id)
  assert(activityRef.commentsCount === 0, 'Deleting a top-level comment decrements commentsCount by itself AND its cascade-deleted reply together')

  console.log(`\n${failures === 0 ? '✓ All M6 mocked unit checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
