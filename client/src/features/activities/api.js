const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const message = body?.error?.message || 'Something went wrong. Please try again.'
    throw new Error(message)
  }

  return body?.data
}

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
  return request(`/api/activities${toQueryString(params)}`)
}

export function getActivityRequest(id) {
  return request(`/api/activities/${id}`)
}

export function createActivityRequest(data) {
  return request('/api/activities', { method: 'POST', body: JSON.stringify(data) })
}

export function updateActivityRequest(id, data) {
  return request(`/api/activities/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
}

export function deleteActivityRequest(id) {
  return request(`/api/activities/${id}`, { method: 'DELETE' })
}

export function listGroupsRequest() {
  return request('/api/groups')
}

export function createGroupRequest(name) {
  return request('/api/groups', { method: 'POST', body: JSON.stringify({ name }) })
}

export function listCompanionsRequest() {
  return request('/api/companions')
}

export function createCompanionRequest(name) {
  return request('/api/companions', { method: 'POST', body: JSON.stringify({ name }) })
}
