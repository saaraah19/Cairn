import { apiRequest, apiFetch } from '../../lib/apiClient.js'

function toQueryString(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function listGearRequest(params) {
  return apiRequest(`/api/gear${toQueryString(params)}`)
}

export function getGearRequest(id) {
  return apiRequest(`/api/gear/${id}`)
}

export function createGearRequest(data) {
  return apiRequest('/api/gear', { method: 'POST', body: JSON.stringify(data) })
}

export function updateGearRequest(id, data) {
  return apiRequest(`/api/gear/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteGearRequest(id) {
  return apiRequest(`/api/gear/${id}`, { method: 'DELETE' })
}

export function getGearUsageRequest(id) {
  return apiRequest(`/api/gear/${id}/usage`)
}

export async function uploadGearPhotoRequest(id, file) {
  const formData = new FormData()
  formData.append('photo', file)
  const res = await apiFetch(`/api/gear/${id}/photo`, { method: 'POST', body: formData })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error?.message || 'Something went wrong. Please try again.')
  return body?.data
}

export function removeGearPhotoRequest(id) {
  return apiRequest(`/api/gear/${id}/photo`, { method: 'DELETE' })
}
