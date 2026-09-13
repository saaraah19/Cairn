import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getPublicActivityRequest, giveKudosRequest, removeKudosRequest, reportActivityRequest } from './api.js'
import { useAuth } from '../auth/useAuth.js'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { ReportButton } from './ReportButton.jsx'
import { PublicPhotoGallery } from './PublicPhotoGallery.jsx'
import { CommentSection } from './CommentSection.jsx'
import {
  formatDate,
  formatDuration,
  formatDistance,
  formatElevation,
  TYPE_LABELS,
  DIFFICULTY_LABELS,
  WEATHER_LABELS,
  TRAIL_CONDITION_LABELS,
} from '../activities/formatters.js'
import './PublicActivityDetail.css'

export function PublicActivityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activity, setActivity] = useState(null)
  const [error, setError] = useState(null)
  const [loadedId, setLoadedId] = useState(null)
  const [isTogglingKudos, setIsTogglingKudos] = useState(false)
  const [kudosError, setKudosError] = useState(null)

  const isLoading = loadedId !== id && !error

  useEffect(() => {
    let cancelled = false
    getPublicActivityRequest(id)
      .then((data) => {
        if (!cancelled) {
          setActivity(data.activity)
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

  if (isLoading) {
    return <LoadingState label="Loading activity…" />
  }

  if (error || !activity) {
    return (
      <EmptyState
        title="This activity isn't available."
        description="It may have been made private, deleted, or the link may be incorrect."
        action={
          <Link to="/" className="public-activity-back-link">
            Back to Cairn
          </Link>
        }
      />
    )
  }

  async function toggleKudos() {
    if (!user) {
      navigate('/login')
      return
    }
    setKudosError(null)
    setIsTogglingKudos(true)
    try {
      const result = activity.hasKudos ? await removeKudosRequest(activity.id) : await giveKudosRequest(activity.id)
      setActivity((prev) => ({ ...prev, kudosCount: result.kudosCount, hasKudos: result.hasKudos }))
    } catch (err) {
      setKudosError(err.message)
    } finally {
      setIsTogglingKudos(false)
    }
  }

  const isOwnActivity = user && String(user._id) === String(activity.authorId)

  const { location, trail, conditions, review, social, destination } = activity

  return (
    <div className="public-activity">
      {activity.photos?.length > 0 && <PublicPhotoGallery photos={activity.photos} />}

      <div className="public-activity-header">
        <h1>{activity.name}</h1>
        <p className="public-activity-meta">
          {TYPE_LABELS[activity.type] ?? activity.type} · {formatDate(activity.date)}
          {location?.placeName && ` · ${location.placeName}`}
          {location?.wilaya && `, ${location.wilaya}`}
        </p>
        {activity.author && (
          <p className="public-activity-author">
            By{' '}
            {activity.author.username ? (
              <Link to={`/community/users/${activity.author.username}`}>{activity.author.name}</Link>
            ) : (
              activity.author.name
            )}
          </p>
        )}
        {social?.groupName && <p className="public-activity-group">With {social.groupName}</p>}
      </div>

      <div className="public-activity-stats">
        {trail?.distanceKm != null && (
          <div className="public-activity-stat">
            <span className="public-activity-stat-value">{formatDistance(trail.distanceKm)}</span>
            <span className="public-activity-stat-label">Distance</span>
          </div>
        )}
        {trail?.durationMinutes != null && (
          <div className="public-activity-stat">
            <span className="public-activity-stat-value">{formatDuration(trail.durationMinutes)}</span>
            <span className="public-activity-stat-label">Duration</span>
          </div>
        )}
        {trail?.elevationGainM != null && (
          <div className="public-activity-stat">
            <span className="public-activity-stat-value">{formatElevation(trail.elevationGainM)}</span>
            <span className="public-activity-stat-label">Elevation</span>
          </div>
        )}
        {trail?.difficulty && (
          <div className="public-activity-stat">
            <span className="public-activity-stat-value">{DIFFICULTY_LABELS[trail.difficulty] ?? trail.difficulty}</span>
            <span className="public-activity-stat-label">Difficulty</span>
          </div>
        )}
      </div>

      {activity.publicCaption && <p className="public-activity-caption">{activity.publicCaption}</p>}

      {destination?.name && (
        <p className="public-activity-destination">
          Destination: {destination.name}
          {destination.wilaya && ` (${destination.wilaya})`}
        </p>
      )}

      {(conditions?.weather || conditions?.temperatureC != null || conditions?.trailCondition) && (
        <div className="public-activity-section">
          <h2>Conditions</h2>
          <p>
            {conditions.weather && WEATHER_LABELS[conditions.weather]}
            {conditions.temperatureC != null && ` · ${conditions.temperatureC}°C`}
            {conditions.trailCondition && ` · ${TRAIL_CONDITION_LABELS[conditions.trailCondition]} trail`}
          </p>
        </div>
      )}

      {review?.challenges && (
        <div className="public-activity-section">
          <h2>Challenges</h2>
          <p>{review.challenges}</p>
        </div>
      )}

      <div className="public-activity-kudos">
        <span className="public-activity-kudos-count">{activity.kudosCount}</span>
        <span>kudos</span>
        {!isOwnActivity && (
          <button
            type="button"
            className="public-activity-kudos-button"
            onClick={toggleKudos}
            disabled={isTogglingKudos}
          >
            {activity.hasKudos ? 'Kudos given ✓' : 'Give kudos'}
          </button>
        )}
        {kudosError && <span className="public-activity-kudos-error">{kudosError}</span>}
      </div>

      {!isOwnActivity && user && (
        <div className="public-activity-report">
          <ReportButton onSubmit={(reason, details) => reportActivityRequest(activity.id, reason, details)} />
        </div>
      )}

      <CommentSection activityId={activity.id} activityOwnerId={activity.authorId} currentUser={user} />
    </div>
  )
}
