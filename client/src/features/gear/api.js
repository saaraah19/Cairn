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

export function listGearRequest(params) {
  return request(`/api/gear${toQueryString(params)}`)
}

export function getGearRequest(id) {
  return request(`/api/gear/${id}`)
}

export function createGearRequest(data) {
  return request('/api/gear', { method: 'POST', body: JSON.stringify(data) })
}

export function updateGearRequest(id, data) {
  return request(`/api/gear/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteGearRequest(id) {
  return request(`/api/gear/${id}`, { method: 'DELETE' })
}

export function getGearUsageRequest(id) {
  return request(`/api/gear/${id}/usage`)
}

export async function uploadGearPhotoRequest(id, file) {
  const formData = new FormData()
  formData.append('photo', file)
  const res = await fetch(`${API_BASE_URL}/api/gear/${id}/photo`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error?.message || 'Something went wrong. Please try again.')
  return body?.data
}

export function removeGearPhotoRequest(id) {
  return request(`/api/gear/${id}/photo`, { method: 'DELETE' })
}
