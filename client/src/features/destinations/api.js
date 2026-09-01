const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error?.message || 'Something went wrong. Please try again.')
  return body?.data
}

function toQueryString(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function listDestinationsRequest(params) {
  return request(`/api/destinations${toQueryString(params)}`)
}

export function getDestinationRequest(id) {
  return request(`/api/destinations/${id}`)
}

export function createDestinationRequest(data) {
  return request('/api/destinations', { method: 'POST', body: JSON.stringify(data) })
}

export function updateDestinationRequest(id, data) {
  return request(`/api/destinations/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteDestinationRequest(id) {
  return request(`/api/destinations/${id}`, { method: 'DELETE' })
}

export function getDestinationRelatedRequest(id) {
  return request(`/api/destinations/${id}/related`)
}

export async function uploadDestinationCoverRequest(id, file) {
  const formData = new FormData()
  formData.append('photo', file)
  const res = await fetch(`${API_BASE_URL}/api/destinations/${id}/cover-image`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error?.message || 'Something went wrong. Please try again.')
  return body?.data
}

export function removeDestinationCoverRequest(id) {
  return request(`/api/destinations/${id}/cover-image`, { method: 'DELETE' })
}
