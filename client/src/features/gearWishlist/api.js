import { apiRequest } from '../../lib/apiClient.js'

function toQueryString(params = {}) {
  const usp = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') usp.set(key, value)
  }
  const qs = usp.toString()
  return qs ? `?${qs}` : ''
}

export function listWishlistItemsRequest(params) {
  return apiRequest(`/api/gear-wishlist${toQueryString(params)}`)
}

export function getWishlistItemRequest(id) {
  return apiRequest(`/api/gear-wishlist/${id}`)
}

export function createWishlistItemRequest(data) {
  return apiRequest('/api/gear-wishlist', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateWishlistItemRequest(id, data) {
  return apiRequest(`/api/gear-wishlist/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteWishlistItemRequest(id) {
  return apiRequest(`/api/gear-wishlist/${id}`, { method: 'DELETE' })
}

export function addOptionRequest(wishlistItemId, data) {
  return apiRequest(`/api/gear-wishlist/${wishlistItemId}/options`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateOptionRequest(wishlistItemId, optionId, data) {
  return apiRequest(`/api/gear-wishlist/${wishlistItemId}/options/${optionId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export function deleteOptionRequest(wishlistItemId, optionId) {
  return apiRequest(`/api/gear-wishlist/${wishlistItemId}/options/${optionId}`, { method: 'DELETE' })
}

export function purchaseOptionRequest(wishlistItemId, optionId) {
  return apiRequest(`/api/gear-wishlist/${wishlistItemId}/options/${optionId}/purchase`, { method: 'POST' })
}
