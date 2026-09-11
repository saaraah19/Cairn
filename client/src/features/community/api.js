import { apiRequest } from '../../lib/apiClient.js'

export function getPublicActivityRequest(id) {
  return apiRequest(`/api/community/activities/${id}`)
}

export function getPublicProfileRequest(username, { cursor } = {}) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  return apiRequest(`/api/community/users/${username}${qs}`)
}

export function getFeedRequest({ scope = 'explore', type, wilaya, cursor } = {}) {
  const params = new URLSearchParams({ scope })
  if (type) params.set('type', type)
  if (wilaya) params.set('wilaya', wilaya)
  if (cursor) params.set('cursor', cursor)
  return apiRequest(`/api/community/feed?${params.toString()}`)
}
