import { apiRequest, apiFetch } from '../../lib/apiClient.js'

export function updateProfileRequest(data) {
  return apiRequest('/api/profile', { method: 'PATCH', body: JSON.stringify(data) })
}

export function changePasswordRequest(data) {
  return apiRequest('/api/profile/password', { method: 'PATCH', body: JSON.stringify(data) })
}

export async function uploadProfilePictureRequest(file) {
  const formData = new FormData()
  formData.append('photo', file)
  const res = await apiFetch('/api/profile/picture', { method: 'POST', body: formData })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error?.message || 'Something went wrong. Please try again.')
  return body?.data
}

export function removeProfilePictureRequest() {
  return apiRequest('/api/profile/picture', { method: 'DELETE' })
}

// Returns a blob, not JSON — downloads the export file directly.
export async function exportDataRequest() {
  const res = await apiFetch('/api/profile/export')
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error?.message || 'Something went wrong. Please try again.')
  }
  return res.blob()
}

export function deleteAccountRequest(data) {
  return apiRequest('/api/profile/account', { method: 'DELETE', body: JSON.stringify(data) })
}
