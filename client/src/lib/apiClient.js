const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

// These are the only paths that must never trigger a refresh attempt on a
// 401 — refreshing before you're logged in makes no sense, and retrying the
// refresh endpoint itself on its own 401 would loop forever.
const NO_REFRESH_PATHS = new Set([
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/google',
  '/api/auth/refresh',
])

// Access tokens are short-lived (15 min) by design; the refresh token
// (7 days) exists specifically so the person doesn't have to re-login every
// 15 minutes. Without this, that refresh token just sits there unused and
// every session silently ends after 15 minutes regardless of activity.
//
// A single in-flight refresh promise is shared across concurrent requests,
// so if three API calls all hit a 401 at once (e.g. a page loading several
// things in parallel), they wait on one refresh attempt rather than firing
// three simultaneous /refresh calls.
let refreshPromise = null

function attemptRefresh() {
  refreshPromise ??= fetch(`${API_BASE_URL}/api/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshPromise = null
    })
  return refreshPromise
}

// Raw fetch with credentials + one automatic retry-after-refresh on a 401.
// Used directly by callers that need non-JSON handling (file uploads,
// blob downloads); apiRequest below wraps this for the common JSON case.
export async function apiFetch(path, options = {}) {
  let res = await fetch(`${API_BASE_URL}${path}`, { ...options, credentials: 'include' })

  if (res.status === 401 && !NO_REFRESH_PATHS.has(path)) {
    const refreshed = await attemptRefresh()
    if (refreshed) {
      res = await fetch(`${API_BASE_URL}${path}`, { ...options, credentials: 'include' })
    }
  }

  return res
}

export async function apiRequest(path, options = {}) {
  const res = await apiFetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    throw new Error(body?.error?.message || 'Something went wrong. Please try again.')
  }

  return body?.data
}
