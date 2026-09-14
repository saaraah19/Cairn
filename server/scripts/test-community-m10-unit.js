// M10 — Comment Likes & Replies: mocked unit verification.
//
// Same sandbox limitation as M1-M9 (no MongoDB reachable here). Property
// under test, per docs/08_COMMUNITY_PROPOSAL.md §5's 2026-09-13 revision:
// a reply must target a top-level comment on the SAME activity; a reply
// to a reply is rejected (threading capped at one level); a reply
// notifies the parent comment's author, not the activity owner again;
// deleting a top-level comment cascades to its replies; comment likes
// follow the exact same consistency strategy as Kudos (self-like
// blocked, duplicate is idempotent, unlike is idempotent, counter never
// goes negative); a comment's DTO carries hasLiked/likesCount correctly
// per viewer.
//
// Usage: node scripts/test-community-m10-unit.js

import { Activity } from '../src/models/Activity.js'
import { Comment } from '../src/models/Comment.js'
import { CommentLike } from '../src/models/CommentLike.js'
import { Notification } from '../src/models/Notification.js'
import { listComments, createComment, deleteComment } from '../src/services/commentService.js'
import { likeComment, unlikeComment } from '../src/services/commentLikeService.js'

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
let likes
let notifications
let commentIdCounter

function resetFixtures() {
  activities = [
    { _id: 'act-public', userId: 'owner-1', visibility: 'public', commentsCount: 0 },
    { _id: 'act-public-2', userId: 'owner-2', visibility: 'public', commentsCount: 0 },
  ]
  comments = []
  likes = []
  notifications = []
  commentIdCounter = 1
}

function installMocks() {
  Activity.findOne = (filter) => {
    const found = activities.find(
      (a) => a._id === filter._id && (filter.visibility === undefined || a.visibility === filter.visibility)
    )
    return { select: () => Promise.resolve(found ? { ...found } : null) }
  }

  // commentService keeps Activity.commentsCount in sync on create/delete —
  // not what M10 tests directly, so these just need to exist and behave
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
      likesCount: 0,
      ...doc,
      editedAt: null,
      createdAt: new Date(),
      populate: async function () {
        return this
      },
    }
    comments.push(created)
    return created
  }

  Comment.findById = (id) => {
    const found = comments.find((c) => c._id === id)
    const withHelpers = found && { ...found, populate: async function () { return this } }
    return {
      select: () => Promise.resolve(withHelpers ?? null),
      then: (resolve) => resolve(withHelpers ?? null),
    }
  }

  Comment.find = (filter) => {
    const matched = comments.filter(
      (c) =>
        (filter.activityId === undefined || c.activityId === filter.activityId) &&
        (filter.parentCommentId === undefined ||
          (filter.parentCommentId === null ? c.parentCommentId === null : c.parentCommentId === filter.parentCommentId))
    )
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

  Comment.deleteMany = async (filter) => {
    comments = comments.filter((c) => c.parentCommentId !== filter.parentCommentId)
  }

  Comment.countDocuments = async (filter) => comments.filter((c) => c.parentCommentId === filter.parentCommentId).length

  Comment.findByIdAndUpdate = (id, update) => {
    const comment = comments.find((c) => c._id === id)
    if (!comment) return { select: () => Promise.resolve(null) }
    comment.likesCount += update.$inc.likesCount
    return { select: () => Promise.resolve({ ...comment }) }
  }

  Comment.findOneAndUpdate = (filter) => {
    const comment = comments.find((c) => c._id === filter._id)
    if (!comment || (filter.likesCount && comment.likesCount <= 0)) {
      return { select: () => Promise.resolve(null) }
    }
    comment.likesCount -= 1
    return { select: () => Promise.resolve({ ...comment }) }
  }

  CommentLike.create = async (doc) => {
    const isDuplicate = likes.some((l) => l.commentId === doc.commentId && l.userId === doc.userId)
    if (isDuplicate) {
      const err = new Error('E11000 duplicate key error')
      err.code = 11000
      throw err
    }
    const created = { _id: `like-${likes.length + 1}`, ...doc }
    likes.push(created)
    return created
  }

  CommentLike.exists = async (filter) => {
    const found = likes.some((l) => l.commentId === filter.commentId && l.userId === filter.userId)
    return found ? { _id: 'x' } : null
  }

  CommentLike.findOneAndDelete = async (filter) => {
    const idx = likes.findIndex((l) => l.commentId === filter.commentId && l.userId === filter.userId)
    if (idx === -1) return null
    const [removed] = likes.splice(idx, 1)
    return removed
  }

  Notification.create = async (doc) => {
    notifications.push(doc)
    return doc
  }
}

async function run() {
  console.log('=== M10 — Comment Likes & Replies: mocked unit verification ===\n')
  installMocks()

  // --- Replies ---

  resetFixtures()
  const topLevel = await createComment('commenter-1', 'act-public', 'Wow, where is this place?')
  assert(topLevel.parentCommentId === null, 'A top-level comment has parentCommentId: null')
  assert(Array.isArray(topLevel.replies) && topLevel.replies.length === 0, 'A freshly created comment starts with an empty replies array')

  const reply = await createComment('owner-1', 'act-public', "It's Cap Blanc, near Oran!", topLevel.id)
  assert(String(reply.parentCommentId) === String(topLevel.id), 'A reply correctly references its parent comment')

  // Reply notifies the PARENT COMMENT's author (commenter-1), not the
  // activity owner again — the activity owner already got a 'comment'
  // notification when the top-level comment was first posted.
  assert(notifications.length === 2, 'Two notifications exist: one for the original comment, one for the reply')
  assert(notifications[1].recipientUserId === 'commenter-1', 'The reply notifies the person who asked, not the activity owner again')
  assert(notifications[1].type === 'reply', 'The reply notification has type "reply"')

  // Replying to a REPLY is rejected — capped at one level.
  try {
    await createComment('commenter-2', 'act-public', 'Can I get directions?', reply.id)
    assert(false, 'Replying to a reply throws')
  } catch (err) {
    assert(err.status === 422, 'Replying to a reply is rejected with 422 (threading capped at one level)')
  }

  // Replying with a parentCommentId from a DIFFERENT activity is rejected.
  try {
    await createComment('commenter-3', 'act-public-2', 'Nice!', topLevel.id)
    assert(false, "Replying using another activity's comment id throws")
  } catch (err) {
    assert(err.status === 404, "A parentCommentId belonging to a different activity is rejected as not found")
  }

  // Replying to a nonexistent comment id is rejected.
  try {
    await createComment('commenter-4', 'act-public', 'Hello?', 'comment-does-not-exist')
    assert(false, 'Replying to a nonexistent comment throws')
  } catch (err) {
    assert(err.status === 404, 'Replying to a nonexistent parent comment throws 404')
  }

  // listComments nests the reply under its parent, not as a separate
  // top-level entry.
  const { comments: listed } = await listComments('act-public')
  assert(listed.length === 1, 'listComments returns exactly one TOP-LEVEL comment (the reply is not counted separately)')
  assert(listed[0].replies.length === 1, "The top-level comment's replies array contains exactly the one reply")
  assert(listed[0].replies[0].text === "It's Cap Blanc, near Oran!", 'The nested reply has the correct text')

  // Deleting a top-level comment cascades to delete its replies too.
  await deleteComment('commenter-1', topLevel.id)
  assert(comments.find((c) => c._id === reply.id) === undefined, "Deleting a top-level comment also deletes its reply")

  console.log('')

  // --- Likes ---

  resetFixtures()
  const comment = await createComment('author-1', 'act-public', 'Great write-up!')
  // createComment itself already produced one 'comment' notification (to
  // act-public's owner, owner-1) — the assertions below check what gets
  // ADDED on top of that by the likes themselves.

  // Self-like is blocked.
  try {
    await likeComment('author-1', comment.id)
    assert(false, 'Liking your own comment throws')
  } catch (err) {
    assert(err.status === 422, 'Liking your own comment throws 422')
  }

  // A genuine like succeeds and notifies the comment's author.
  const likeResult = await likeComment('liker-1', comment.id)
  assert(likeResult.likesCount === 1, 'A successful like increments likesCount to 1')
  assert(likeResult.hasLiked === true, 'A successful like reports hasLiked: true')
  assert(notifications.length === 2, 'A second notification (for the like) now exists, on top of the original comment notification')
  assert(notifications[1].recipientUserId === 'author-1', "The like notification goes to the comment's author")
  assert(notifications[1].type === 'comment_like', 'The notification has type "comment_like"')

  // Liking the same comment again is idempotent — no double-count, no
  // second notification.
  const likeAgain = await likeComment('liker-1', comment.id)
  assert(likeAgain.likesCount === 1, 'Liking the same comment twice does not double-increment the count')
  assert(notifications.length === 2, 'Liking the same comment twice does not create a further notification')

  // A different liker increments independently.
  const secondLiker = await likeComment('liker-2', comment.id)
  assert(secondLiker.likesCount === 2, 'A second, different user liking the same comment increments the count to 2')

  // Unliking works and is idempotent; the counter never goes negative.
  const unlikeResult = await unlikeComment('liker-1', comment.id)
  assert(unlikeResult.likesCount === 1, 'Unliking decrements the count back to 1')
  assert(unlikeResult.hasLiked === false, 'Unliking reports hasLiked: false')

  const unlikeAgain = await unlikeComment('liker-1', comment.id)
  assert(unlikeAgain.likesCount === 1, 'Unliking a comment you already unliked is a safe no-op (count unchanged)')

  await unlikeComment('liker-2', comment.id)
  const overUnlike = await unlikeComment('liker-2', comment.id)
  assert(overUnlike.likesCount === 0, 'The like counter never goes below zero, even after redundant unlike attempts')

  // Liking a comment whose parent activity has since gone private is
  // rejected — same re-verification rule as reports/kudos/follow.
  activities[0].visibility = 'private'
  try {
    await likeComment('liker-3', comment.id)
    assert(false, 'Liking a comment on a now-private activity throws')
  } catch (err) {
    assert(err.status === 404, 'Liking a comment on a now-private activity throws 404')
  }

  console.log(`\n${failures === 0 ? '✓ All M10 mocked unit checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
