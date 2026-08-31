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

export function listPlannedActivitiesRequest(params) {
  return request(`/api/planned-activities${toQueryString(params)}`)
}

export function getPlannedActivityRequest(id) {
  return request(`/api/planned-activities/${id}`)
}

export function createPlannedActivityRequest(data) {
  return request('/api/planned-activities', { method: 'POST', body: JSON.stringify(data) })
}

export function updatePlannedActivityRequest(id, data) {
  return request(`/api/planned-activities/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deletePlannedActivityRequest(id) {
  return request(`/api/planned-activities/${id}`, { method: 'DELETE' })
}

export function completePlannedActivityRequest(id, activityId) {
  return request(`/api/planned-activities/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ activityId }),
  })
}
