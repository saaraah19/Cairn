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

export function giveKudosRequest(activityId) {
  return apiRequest(`/api/community/activities/${activityId}/kudos`, { method: 'POST' })
}

export function removeKudosRequest(activityId) {
  return apiRequest(`/api/community/activities/${activityId}/kudos`, { method: 'DELETE' })
}

export function getCommentsRequest(activityId, { cursor } = {}) {
  const qs = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
  return apiRequest(`/api/community/activities/${activityId}/comments${qs}`)
}

export function postCommentRequest(activityId, text) {
  return apiRequest(`/api/community/activities/${activityId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export function updateCommentRequest(commentId, text) {
  return apiRequest(`/api/community/comments/${commentId}`, {
    method: 'PATCH',
    body: JSON.stringify({ text }),
  })
}

export function deleteCommentRequest(commentId) {
  return apiRequest(`/api/community/comments/${commentId}`, { method: 'DELETE' })
}

export function reportActivityRequest(activityId, reason, details) {
  return apiRequest(`/api/community/activities/${activityId}/reports`, {
    method: 'POST',
    body: JSON.stringify(details ? { reason, details } : { reason }),
  })
}

export function reportCommentRequest(commentId, reason, details) {
  return apiRequest(`/api/community/comments/${commentId}/reports`, {
    method: 'POST',
    body: JSON.stringify(details ? { reason, details } : { reason }),
  })
}

export function followUserRequest(username) {
  return apiRequest(`/api/community/users/${username}/follow`, { method: 'POST' })
}

export function unfollowUserRequest(username) {
  return apiRequest(`/api/community/users/${username}/follow`, { method: 'DELETE' })
}
