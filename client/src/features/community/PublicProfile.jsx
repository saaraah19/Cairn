import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getPublicProfileRequest, followUserRequest, unfollowUserRequest } from './api.js'
import { useAuth } from '../auth/useAuth.js'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import { formatDate, formatDistance, TYPE_LABELS } from '../activities/formatters.js'
import './PublicProfile.css'

export function PublicProfile() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loadedUsername, setLoadedUsername] = useState(null)
  const [isTogglingFollow, setIsTogglingFollow] = useState(false)
  const [followError, setFollowError] = useState(null)

  const isLoading = loadedUsername !== username && !error

  useEffect(() => {
    let cancelled = false
    getPublicProfileRequest(username)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoadedUsername(username)
      })
    return () => {
      cancelled = true
    }
  }, [username])

  if (isLoading) {
    return <LoadingState label="Loading profile…" />
  }

  if (error || !data) {
    return (
      <EmptyState
        title="This profile isn't available."
        description="It may be private, or the link may be incorrect."
        action={
          <Link to="/" className="public-activity-back-link">
            Back to Cairn
          </Link>
        }
      />
    )
  }

  const { profile, statistics, activities } = data
  const isOwnProfile = user && String(user._id) === String(profile.id)

  async function toggleFollow() {
    if (!user) {
      navigate('/login')
      return
    }
    setFollowError(null)
    setIsTogglingFollow(true)
    try {
      const result = data.isFollowing ? await unfollowUserRequest(username) : await followUserRequest(username)
      setData((prev) => ({ ...prev, isFollowing: result.isFollowing }))
    } catch (err) {
      setFollowError(err.message)
    } finally {
      setIsTogglingFollow(false)
    }
  }

  return (
    <div className="public-profile">
      <div className="public-profile-header">
        {profile.profilePicture?.secureUrl ? (
          <img className="public-profile-avatar" src={profile.profilePicture.secureUrl} alt="" />
        ) : (
          <div className="public-profile-avatar public-profile-avatar-placeholder">
            {profile.name?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div>
          <h1>{profile.name}</h1>
          <p className="public-profile-username">@{profile.username}</p>
          {profile.location && <p className="public-profile-location">{profile.location}</p>}
        </div>
      </div>

      {!isOwnProfile && (
        <div className="public-profile-follow">
          <button
            type="button"
            className="public-profile-follow-button"
            onClick={toggleFollow}
            disabled={isTogglingFollow}
          >
            {data.isFollowing ? 'Following ✓' : 'Follow'}
          </button>
          {followError && <span className="public-profile-follow-error">{followError}</span>}
        </div>
      )}

      {profile.bio && <p className="public-profile-bio">{profile.bio}</p>}

      <div className="public-profile-stats">
        <div className="public-profile-stat">
          <span className="public-profile-stat-value">{statistics.totals.activities}</span>
          <span className="public-profile-stat-label">Activities</span>
        </div>
        <div className="public-profile-stat">
          <span className="public-profile-stat-value">{statistics.totals.distanceKm}</span>
          <span className="public-profile-stat-label">km</span>
        </div>
        <div className="public-profile-stat">
          <span className="public-profile-stat-value">{statistics.totals.elevationGainM}</span>
          <span className="public-profile-stat-label">m gained</span>
        </div>
      </div>

      <h2 className="public-profile-section-title">Public activities</h2>
      {activities.length === 0 ? (
        <EmptyState title="No public activities yet." description="Check back later." />
      ) : (
        <ul className="public-profile-activity-list">
          {activities.map((a) => (
            <li key={a.id}>
              <Link to={`/community/activities/${a.id}`} className="public-profile-activity-link">
                <span className="public-profile-activity-name">{a.name}</span>
                <span className="public-profile-activity-meta">
                  {TYPE_LABELS[a.type] ?? a.type} · {formatDate(a.date)}
                  {a.trail?.distanceKm != null && ` · ${formatDistance(a.trail.distanceKm)}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
