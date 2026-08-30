import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getActivityRequest } from './api.js'
import { ActivityForm } from './ActivityForm.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import './pageWrapper.css'

export function ActivityEditPage() {
  const { id } = useParams()
  const [activity, setActivity] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getActivityRequest(id)
      .then((data) => {
        if (!cancelled) setActivity(data.activity)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id])

  if (isLoading) return <LoadingState label="Loading activity…" />
  if (error) return <EmptyState title="Couldn't load this activity" description={error} />

  return (
    <div>
      <div className="page-header">
        <h1>Edit #{activity.activityNumber}</h1>
      </div>
      <ActivityForm activity={activity} activityId={id} />
    </div>
  )
}
