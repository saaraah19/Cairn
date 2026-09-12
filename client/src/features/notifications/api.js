import { apiRequest } from '../../lib/apiClient.js'

export function getNotificationsRequest({ cursor, limit } = {}) {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  if (limit) params.set('limit', limit)
  const query = params.toString()
  return apiRequest(`/api/notifications${query ? `?${query}` : ''}`)
}

export function getUnreadCountRequest() {
  return apiRequest('/api/notifications/unread-count')
}

export function markNotificationReadRequest(id) {
  return apiRequest(`/api/notifications/${id}/read`, { method: 'PATCH' })
}

export function markAllNotificationsReadRequest() {
  return apiRequest('/api/notifications/read-all', { method: 'PATCH' })
}
