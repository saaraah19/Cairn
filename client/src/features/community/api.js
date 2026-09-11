import { apiRequest } from '../../lib/apiClient.js'

export function getPublicActivityRequest(id) {
  return apiRequest(`/api/community/activities/${id}`)
}

export function getPublicProfileRequest(username, { cursor } = {}) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  return apiRequest(`/api/community/users/${username}${qs}`)
}
