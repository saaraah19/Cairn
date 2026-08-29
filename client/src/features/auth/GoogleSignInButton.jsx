import { useEffect, useRef, useState } from 'react'
import { useAuth } from './useAuth.js'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Renders Google's own "Sign in with Google" button via Google Identity
// Services (loaded in index.html). On success it hands the ID token to the
// backend for verification — see docs/PROGRESS.md for why this approach
// (rather than a server-side redirect flow) was chosen.
export function GoogleSignInButton() {
  const { loginWithGoogle } = useAuth()
  const buttonRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    let cancelled = false

    function handleCredentialResponse(response) {
      setError(null)
      loginWithGoogle(response.credential).catch((err) => {
        if (!cancelled) setError(err.message)
      })
    }

    function init() {
      if (!window.google?.accounts?.id || !buttonRef.current) return

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      })

      window.google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        width: 320,
      })
    }

    // The GIS script loads async; poll briefly until it's ready.
    if (window.google?.accounts?.id) {
      init()
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval)
          init()
        }
      }, 100)
      return () => {
        cancelled = true
        clearInterval(interval)
      }
    }

    return () => {
      cancelled = true
    }
  }, [loginWithGoogle])

  if (!GOOGLE_CLIENT_ID) {
    return null // Google sign-in isn't configured; hide the button entirely.
  }

  return (
    <div>
      <div ref={buttonRef} />
      {error && <span className="auth-field-error">{error}</span>}
    </div>
  )
}
