import { apiRequest, apiFetch } from '../../lib/apiClient.js'

function toQueryString(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function listDestinationsRequest(params) {
  return apiRequest(`/api/destinations${toQueryString(params)}`)
}

export function getDestinationRequest(id) {
  return apiRequest(`/api/destinations/${id}`)
}

export function createDestinationRequest(data) {
  return apiRequest('/api/destinations', { method: 'POST', body: JSON.stringify(data) })
}

export function updateDestinationRequest(id, data) {
  return apiRequest(`/api/destinations/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteDestinationRequest(id) {
  return apiRequest(`/api/destinations/${id}`, { method: 'DELETE' })
}

export function getDestinationRelatedRequest(id) {
  return apiRequest(`/api/destinations/${id}/related`)
}

export async function uploadDestinationCoverRequest(id, file) {
  const formData = new FormData()
  formData.append('photo', file)
  const res = await apiFetch(`/api/destinations/${id}/cover-image`, { method: 'POST', body: formData })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error?.message || 'Something went wrong. Please try again.')
  return body?.data
}

export function removeDestinationCoverRequest(id) {
  return apiRequest(`/api/destinations/${id}/cover-image`, { method: 'DELETE' })
}
