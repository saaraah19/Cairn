import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCommentsRequest,
  postCommentRequest,
  updateCommentRequest,
  deleteCommentRequest,
  reportCommentRequest,
  likeCommentRequest,
  unlikeCommentRequest,
} from './api.js'
import { formatDate } from '../activities/formatters.js'
import { ReportButton } from './ReportButton.jsx'
import './CommentSection.css'

function CommentAuthor({ comment }) {
  return <span className="comment-author">{comment.authorName ?? comment.authorUsername ?? 'A hiker'}</span>
}

// One like button, shared by top-level comments and replies alike — a
// like is just a like regardless of nesting level. Optimistic toggle: the
// count and hasLiked flip immediately, and roll back only if the request
// actually fails.
function CommentLikeButton({ comment, currentUser, onLikeChanged }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function toggle() {
    if (!currentUser || isSubmitting) return
    setIsSubmitting(true)
    const wasLiked = comment.hasLiked
    onLikeChanged(comment.id, { hasLiked: !wasLiked, likesCount: comment.likesCount + (wasLiked ? -1 : 1) })
    try {
      const result = wasLiked ? await unlikeCommentRequest(comment.id) : await likeCommentRequest(comment.id)
      onLikeChanged(comment.id, result)
    } catch {
      onLikeChanged(comment.id, { hasLiked: wasLiked, likesCount: comment.likesCount })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <button
      type="button"
      className={`comment-like-button${comment.hasLiked ? ' liked' : ''}`}
      onClick={toggle}
      disabled={!currentUser || isSubmitting}
    >
      ▲ {comment.likesCount > 0 ? comment.likesCount : 'Like'}
    </button>
  )
}

function CommentItem({
  comment,
  currentUser,
  isActivityOwner,
  isReply = false,
  onUpdated,
  onDeleted,
  onLikeChanged,
  onReplyPosted,
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [isReplying, setIsReplying] = useState(false)
  const [replyDraft, setReplyDraft] = useState('')
  const [isPostingReply, setIsPostingReply] = useState(false)
  const [replyError, setReplyError] = useState(null)

  const isAuthor = currentUser && String(currentUser._id) === String(comment.authorId)
  const canDelete = isAuthor || isActivityOwner

  async function handleSave() {
    if (!draft.trim()) return
    setIsSaving(true)
    setError(null)
    try {
      const data = await updateCommentRequest(comment.id, draft.trim())
      onUpdated(data.comment)
      setIsEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete() {
    setIsSaving(true)
    try {
      await deleteCommentRequest(comment.id)
      onDeleted(comment)
    } catch (err) {
      setError(err.message)
      setIsSaving(false)
    }
  }

  async function handleReplySubmit(e) {
    e.preventDefault()
    if (!replyDraft.trim()) return
    setIsPostingReply(true)
    setReplyError(null)
    try {
      const data = await postCommentRequest(comment.activityId, replyDraft.trim(), comment.id)
      onReplyPosted(comment.id, data.comment)
      setReplyDraft('')
      setIsReplying(false)
    } catch (err) {
      setReplyError(err.message)
    } finally {
      setIsPostingReply(false)
    }
  }

  return (
    <li className={`comment-item${isReply ? ' comment-item-reply' : ''}`}>
      <div className="comment-item-header">
        <CommentAuthor comment={comment} />
        <span className="comment-date">
          {formatDate(comment.createdAt)}
          {comment.editedAt && ' · edited'}
        </span>
      </div>

      {isEditing ? (
        <div className="comment-edit">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} rows={2} />
          <div className="comment-edit-actions">
            <button type="button" onClick={handleSave} disabled={isSaving}>
              Save
            </button>
            <button
              type="button"
              className="comment-cancel"
              onClick={() => {
                setIsEditing(false)
                setDraft(comment.text)
              }}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="comment-text">{comment.text}</p>
      )}

      {error && <p className="comment-error">{error}</p>}

      {!isEditing && (
        <div className="comment-actions">
          <CommentLikeButton comment={comment} currentUser={currentUser} onLikeChanged={onLikeChanged} />

          {/* Replying to a reply isn't supported — threading is capped at
              one level (docs/08_COMMUNITY_PROPOSAL.md §5's 2026-09-13
              revision), so this action only shows on top-level comments. */}
          {!isReply && currentUser && (
            <button type="button" onClick={() => setIsReplying((v) => !v)}>
              Reply
            </button>
          )}

          {isAuthor && (
            <button type="button" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={handleDelete} disabled={isSaving}>
              Delete
            </button>
          )}

          {/* Reporting is for someone else's comment — never your own. */}
          {currentUser && !isAuthor && (
            <ReportButton onSubmit={(reason, details) => reportCommentRequest(comment.id, reason, details)} />
          )}
        </div>
      )}

      {isReplying && (
        <form className="comment-reply-form" onSubmit={handleReplySubmit}>
          <textarea
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder={`Reply to ${comment.authorName ?? 'this comment'}…`}
            maxLength={1000}
            rows={2}
            autoFocus
          />
          {replyError && <p className="comment-error">{replyError}</p>}
          <div className="comment-edit-actions">
            <button type="submit" disabled={isPostingReply || !replyDraft.trim()}>
              {isPostingReply ? 'Replying…' : 'Reply'}
            </button>
            <button type="button" className="comment-cancel" onClick={() => setIsReplying(false)} disabled={isPostingReply}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {comment.replies?.length > 0 && (
        <ul className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              isActivityOwner={isActivityOwner}
              isReply
              onUpdated={onUpdated}
              onDeleted={onDeleted}
              onLikeChanged={onLikeChanged}
              onReplyPosted={onReplyPosted}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function CommentSection({ activityId, activityOwnerId, currentUser }) {
  const [comments, setComments] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [postError, setPostError] = useState(null)

  const isActivityOwner = currentUser && String(currentUser._id) === String(activityOwnerId)

  useEffect(() => {
    let cancelled = false
    getCommentsRequest(activityId)
      .then((data) => {
        if (!cancelled) {
          setComments(data.comments)
          setNextCursor(data.nextCursor)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [activityId])

  function loadMore() {
    if (!nextCursor) return
    getCommentsRequest(activityId, { cursor: nextCursor }).then((data) => {
      setComments((prev) => [...prev, ...data.comments])
      setNextCursor(data.nextCursor)
    })
  }

  async function handlePost(e) {
    e.preventDefault()
    if (!draft.trim()) return
    setIsPosting(true)
    setPostError(null)
    try {
      const data = await postCommentRequest(activityId, draft.trim())
      setComments((prev) => [...prev, data.comment])
      setDraft('')
    } catch (err) {
      setPostError(err.message)
    } finally {
      setIsPosting(false)
    }
  }

  // A single updater walks both top-level comments and their nested
  // replies — used by edit, like, delete, and reply-posted, since all four
  // need to find "the one comment or reply with this id" and either patch
  // it or remove it, regardless of which level it lives at.
  function mapCommentTree(list, id, transform) {
    return list.map((c) => {
      if (c.id === id) return transform(c)
      if (c.replies?.length) return { ...c, replies: mapCommentTree(c.replies, id, transform) }
      return c
    })
  }

  function handleUpdated(updated) {
    setComments((prev) => mapCommentTree(prev, updated.id, () => updated))
  }

  function handleLikeChanged(id, patch) {
    setComments((prev) => mapCommentTree(prev, id, (c) => ({ ...c, ...patch })))
  }

  function handleDeleted(deleted) {
    if (!deleted.parentCommentId) {
      setComments((prev) => prev.filter((c) => c.id !== deleted.id))
      return
    }
    setComments((prev) =>
      prev.map((c) =>
        c.id === deleted.parentCommentId ? { ...c, replies: c.replies.filter((r) => r.id !== deleted.id) } : c
      )
    )
  }

  function handleReplyPosted(parentId, reply) {
    setComments((prev) => prev.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), reply] } : c)))
  }

  const totalCount = comments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)

  return (
    <div className="comment-section">
      <h2>Comments {totalCount > 0 && `(${totalCount})`}</h2>

      {isLoading && <p className="comment-loading">Loading comments…</p>}

      {!isLoading && comments.length === 0 && <p className="comment-empty">No comments yet.</p>}

      {!isLoading && comments.length > 0 && (
        <ul className="comment-list">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={currentUser}
              isActivityOwner={isActivityOwner}
              onUpdated={handleUpdated}
              onDeleted={handleDeleted}
              onLikeChanged={handleLikeChanged}
              onReplyPosted={handleReplyPosted}
            />
          ))}
        </ul>
      )}

      {nextCursor && (
        <button type="button" className="comment-load-more" onClick={loadMore}>
          Load more comments
        </button>
      )}

      {currentUser ? (
        <form className="comment-form" onSubmit={handlePost}>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share a thought about this adventure…"
            maxLength={1000}
            rows={2}
          />
          {postError && <p className="comment-error">{postError}</p>}
          <button type="submit" disabled={isPosting || !draft.trim()}>
            {isPosting ? 'Posting…' : 'Comment'}
          </button>
        </form>
      ) : (
        <p className="comment-login-prompt">
          <Link to="/login">Log in</Link> to leave a comment.
        </p>
      )}
    </div>
  )
}
