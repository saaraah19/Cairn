const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export async function getStatisticsRequest() {
  const res = await fetch(`${API_BASE_URL}/api/statistics`, { credentials: 'include' })
  const body = await res.json().catch(() => null)
  if (!res.ok) throw new Error(body?.error?.message || 'Something went wrong. Please try again.')
  return body?.data
}
