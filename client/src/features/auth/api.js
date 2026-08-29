const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include', // send/receive the HTTP-only auth cookies
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

export function registerRequest({ name, email, username, password }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, username, password }),
  })
}

export function loginRequest({ email, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function googleAuthRequest({ credential }) {
  return request('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
}

export function logoutRequest() {
  return request('/api/auth/logout', { method: 'POST' })
}

export function meRequest() {
  return request('/api/auth/me')
}
