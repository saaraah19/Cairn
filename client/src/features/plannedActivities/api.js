import { apiRequest } from '../../lib/apiClient.js'

function toQueryString(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value)
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function listPlannedActivitiesRequest(params) {
  return apiRequest(`/api/planned-activities${toQueryString(params)}`)
}

export function getPlannedActivityRequest(id) {
  return apiRequest(`/api/planned-activities/${id}`)
}

export function createPlannedActivityRequest(data) {
  return apiRequest('/api/planned-activities', { method: 'POST', body: JSON.stringify(data) })
}

export function updatePlannedActivityRequest(id, data) {
  return apiRequest(`/api/planned-activities/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deletePlannedActivityRequest(id) {
  return apiRequest(`/api/planned-activities/${id}`, { method: 'DELETE' })
}

export function completePlannedActivityRequest(id, activityId) {
  return apiRequest(`/api/planned-activities/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify({ activityId }),
  })
}
