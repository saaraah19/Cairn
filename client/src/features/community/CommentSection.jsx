import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getCommentsRequest,
  postCommentRequest,
  updateCommentRequest,
  deleteCommentRequest,
} from './api.js'
import { formatDate } from '../activities/formatters.js'
import './CommentSection.css'

function CommentAuthor({ comment }) {
  return <span className="comment-author">{comment.authorName ?? comment.authorUsername ?? 'A hiker'}</span>
}

function CommentItem({ comment, currentUser, isActivityOwner, onUpdated, onDeleted }) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.text)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

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
      onDeleted(comment.id)
    } catch (err) {
      setError(err.message)
      setIsSaving(false)
    }
  }

  return (
    <li className="comment-item">
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

      {(isAuthor || canDelete) && !isEditing && (
        <div className="comment-actions">
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
        </div>
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

  function handleUpdated(updated) {
    setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
  }

  function handleDeleted(id) {
    setComments((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="comment-section">
      <h2>Comments {comments.length > 0 && `(${comments.length})`}</h2>

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
