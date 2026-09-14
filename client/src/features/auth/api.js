import { apiRequest } from '../../lib/apiClient.js'

export function registerRequest({ name, email, username, password }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, username, password }),
  })
}

export function loginRequest({ email, password }) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function googleAuthRequest({ credential }) {
  return apiRequest('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  })
}

export function logoutRequest() {
  return apiRequest('/api/auth/logout', { method: 'POST' })
}

export function meRequest() {
  return apiRequest('/api/auth/me')
}

export function forgotPasswordRequest({ email }) {
  return apiRequest('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export function resetPasswordRequest({ token, password }) {
  return apiRequest('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  })
}
