import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getPlannedActivityRequest } from './api.js'
import { PlannedActivityForm } from './PlannedActivityForm.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import '../activities/pageWrapper.css'

export function PlannedActivityEditPage() {
  const { id } = useParams()
  const [plan, setPlan] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getPlannedActivityRequest(id)
      .then((data) => {
        if (!cancelled) setPlan(data.plannedActivity)
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

  if (isLoading) return <LoadingState label="Loading plan…" />
  if (error) return <EmptyState title="Couldn't load this plan" description={error} />

  return (
    <div>
      <div className="page-header">
        <h1>Edit {plan.name}</h1>
      </div>
      <PlannedActivityForm plan={plan} planId={id} />
    </div>
  )
}
