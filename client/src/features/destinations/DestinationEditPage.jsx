import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getDestinationRequest } from './api.js'
import { DestinationForm } from './DestinationForm.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import '../activities/pageWrapper.css'

export function DestinationEditPage() {
  const { id } = useParams()
  const [destination, setDestination] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getDestinationRequest(id)
      .then((data) => {
        if (!cancelled) setDestination(data.destination)
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

  if (isLoading) return <LoadingState label="Loading destination…" />
  if (error) return <EmptyState title="Couldn't load this destination" description={error} />

  return (
    <div>
      <div className="page-header">
        <h1>Edit {destination.name}</h1>
      </div>
      <DestinationForm destination={destination} destinationId={id} />
    </div>
  )
}
