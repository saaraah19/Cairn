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

export function updateProfileRequest(data) {
  return request('/api/profile', { method: 'PATCH', body: JSON.stringify(data) })
}

export function changePasswordRequest(data) {
  return request('/api/profile/password', { method: 'PATCH', body: JSON.stringify(data) })
}

export async function uploadProfilePictureRequest(file) {
  const formData = new FormData()
  formData.append('photo', file)
  const res = await fetch(`${API_BASE_URL}/api/profile/picture`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error?.message || 'Something went wrong. Please try again.')
  return body?.data
}

export function removeProfilePictureRequest() {
  return request('/api/profile/picture', { method: 'DELETE' })
}
