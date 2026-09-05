import { apiRequest, apiFetch } from '../../lib/apiClient.js'

function toQueryString(params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, value)
    }
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function listActivitiesRequest(params) {
  return apiRequest(`/api/activities${toQueryString(params)}`)
}

export function getActivityRequest(id) {
  return apiRequest(`/api/activities/${id}`)
}

export function createActivityRequest(data) {
  return apiRequest('/api/activities', { method: 'POST', body: JSON.stringify(data) })
}

export function updateActivityRequest(id, data) {
  return apiRequest(`/api/activities/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteActivityRequest(id) {
  return apiRequest(`/api/activities/${id}`, { method: 'DELETE' })
}

export function listGroupsRequest() {
  return apiRequest('/api/groups')
}

export function createGroupRequest(name) {
  return apiRequest('/api/groups', { method: 'POST', body: JSON.stringify({ name }) })
}

export function listCompanionsRequest() {
  return apiRequest('/api/companions')
}

export function createCompanionRequest(name) {
  return apiRequest('/api/companions', { method: 'POST', body: JSON.stringify({ name }) })
}

export function listPhotosRequest(activityId) {
  return apiRequest(`/api/activities/${activityId}/photos`)
}

export async function uploadPhotoRequest(activityId, file) {
  const formData = new FormData()
  formData.append('photo', file)

  // apiFetch (not apiRequest) — no Content-Type header, the browser sets
  // the multipart boundary itself; still gets the retry-on-401 behavior.
  const res = await apiFetch(`/api/activities/${activityId}/photos`, {
    method: 'POST',
    body: formData,
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(body?.error?.message || 'Something went wrong. Please try again.')
  }

  return body?.data
}

export function setCoverPhotoRequest(activityId, photoId) {
  return apiRequest(`/api/activities/${activityId}/photos/${photoId}/cover`, { method: 'PATCH' })
}

export function deletePhotoRequest(photoId) {
  return apiRequest(`/api/photos/${photoId}`, { method: 'DELETE' })
}
