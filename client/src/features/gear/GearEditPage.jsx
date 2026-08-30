import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getGearRequest } from './api.js'
import { GearForm } from './GearForm.jsx'
import { LoadingState } from '../../components/LoadingState.jsx'
import { EmptyState } from '../../components/EmptyState.jsx'
import '../activities/pageWrapper.css'

export function GearEditPage() {
  const { id } = useParams()
  const [gear, setGear] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getGearRequest(id)
      .then((data) => {
        if (!cancelled) setGear(data.gear)
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

  if (isLoading) return <LoadingState label="Loading gear…" />
  if (error) return <EmptyState title="Couldn't load this item" description={error} />

  return (
    <div>
      <div className="page-header">
        <h1>Edit {gear.name}</h1>
      </div>
      <GearForm gear={gear} gearId={id} />
    </div>
  )
}
