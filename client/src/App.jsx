import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch(`${API_BASE_URL}/api/health`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
        return res.json()
      })
      .then((body) => {
        if (!cancelled) setHealth(body)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="status-page">
      <h1>Cairn</h1>
      <p>Project foundation — Phase 0</p>

      {health && (
        <span className="status-pill">
          <span className="status-dot" />
          Backend connected — {health.data?.status ?? 'ok'}
        </span>
      )}

      {error && (
        <span className="status-pill error">
          <span className="status-dot" />
          Backend unreachable: {error}
        </span>
      )}

      {!health && !error && (
        <span className="status-pill">
          <span className="status-dot" />
          Checking backend connection…
        </span>
      )}
    </main>
  )
}

export default App
