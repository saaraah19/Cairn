import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getPlannedActivityRequest, deletePlannedActivityRequest } from './api.js'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { formatDate, TYPE_LABELS, DIFFICULTY_LABELS } from '../activities/formatters.js'
import { STATUS_LABELS, STATUS_COLORS } from './formatters.js'
import '../activities/ActivityDetail.css'

export function PlannedActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const isLoading = loadedId !== id && !error

  useEffect(() => {
    let cancelled = false
    getPlannedActivityRequest(id)
      .then((data) => {
        if (!cancelled) {
          setPlan(data.plannedActivity)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadedId(id)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  async function handleDelete() {
    setIsDeleting(true)
    try {
      await deletePlannedActivityRequest(id)
      navigate('/outdoors')
    } catch (err) {
      setError(err.message)
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  function handleLogActivity() {
    // Hands the plan's known info to the activity form as a starting point;
    // the user can change anything before saving (docs/05_DATA_MODEL_AND_API_CONTRACT.md
    // §26: "actual values must remain editable").
    navigate('/outdoors/new', {
      state: {
        plannedActivityId: plan._id,
        prefill: {
          name: plan.name,
          type: plan.type,
          date: plan.plannedDate?.slice(0, 10),
          placeName: plan.location?.placeName,
          wilaya: plan.location?.wilaya,
          groupName: plan.social?.groupId?.name,
          companions: (plan.social?.companions ?? []).join(', '),
          notes: plan.notes,
        },
      },
    })
  }

  if (isLoading) return <LoadingState label="Loading plan…" />
  if (error && !plan) return <EmptyState title="Couldn't load this plan" description={error} />
  if (!plan) return null

  const isCompleted = plan.status === 'completed'

  return (
    <div>
      <div className="activity-detail-title-row">
        <div>
          <h1>{plan.name}</h1>
          <p className="activity-detail-meta">
            {TYPE_LABELS[plan.type]} · {formatDate(plan.plannedDate)}
            {plan.location?.placeName ? ` · ${plan.location.placeName}` : ''}
          </p>
          <span
            className="planned-status-badge"
            style={{ background: STATUS_COLORS[plan.status] }}
          >
            {STATUS_LABELS[plan.status]}
          </span>
        </div>
        <div className="activity-detail-actions">
          {!isCompleted && (
            <button className="icon-button" onClick={handleLogActivity}>
              Log this activity
            </button>
          )}
          {!isCompleted && (
            <Link to={`/outdoors/planned/${id}/edit`} className="icon-button">
              Edit
            </Link>
          )}
          <button className="icon-button danger" onClick={() => setShowConfirm(true)}>
            Delete
          </button>
        </div>
      </div>

      {isCompleted && plan.completedActivityId && (
        <div className="detail-section">
          <h2>Completed as</h2>
          <p>
            <Link to={`/outdoors/${plan.completedActivityId._id}`}>
              #{plan.completedActivityId.activityNumber} {plan.completedActivityId.name}
            </Link>
          </p>
        </div>
      )}

      {(plan.social?.groupId?.name || plan.social?.companions?.length > 0) && (
        <div className="detail-section">
          <h2>Who's going</h2>
          <div className="detail-kv">
            {plan.social.groupId?.name && (
              <div>
                <span>Group</span>
                <span>{plan.social.groupId.name}</span>
              </div>
            )}
            {plan.social.companions?.length > 0 && (
              <div>
                <span>Companions</span>
                <span>{plan.social.companions.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {(plan.estimatedCostDzd != null || plan.expectedDifficulty) && (
        <div className="detail-section">
          <h2>Expectations</h2>
          <div className="detail-kv">
            {plan.estimatedCostDzd != null && (
              <div>
                <span>Estimated cost</span>
                <span>{plan.estimatedCostDzd} DZD</span>
              </div>
            )}
            {plan.expectedDifficulty && (
              <div>
                <span>Expected difficulty</span>
                <span>{DIFFICULTY_LABELS[plan.expectedDifficulty]}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {plan.notes && (
        <div className="detail-section">
          <h2>Notes</h2>
          <p>{plan.notes}</p>
        </div>
      )}

      {showConfirm && (
        <div className="confirm-dialog-backdrop" role="dialog" aria-modal="true">
          <div className="confirm-dialog">
            <h3>Delete "{plan.name}"?</h3>
            <p>
              {isCompleted
                ? 'The completed activity itself will not be deleted, only this plan record.'
                : 'This permanently removes the plan. This can\'t be undone.'}
            </p>
            <div className="confirm-dialog-actions">
              <button className="icon-button" onClick={() => setShowConfirm(false)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="icon-button danger" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
