import { useCallback, useEffect, useState } from 'react'
import { registerRequest, loginRequest, googleAuthRequest, logoutRequest, meRequest } from './api.js'
import { AuthContext } from './authContextObject.js'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // On first load, check whether an existing session (access-token cookie)
  // is still valid, so a page refresh doesn't log the user out.
  useEffect(() => {
    let cancelled = false

    meRequest()
      .then((data) => {
        if (!cancelled) setUser(data.user)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const register = useCallback(async (fields) => {
    const data = await registerRequest(fields)
    setUser(data.user)
    return data.user
  }, [])

  const login = useCallback(async (fields) => {
    const data = await loginRequest(fields)
    setUser(data.user)
    return data.user
  }, [])

  const loginWithGoogle = useCallback(async (credential) => {
    const data = await googleAuthRequest({ credential })
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    setUser(null)
  }, [])

  // Lets other features (profile settings, picture upload, etc.) sync the
  // app-wide user state after an update, without each one needing its own
  // notion of "the current user."
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser)
  }, [])

  const value = { user, isLoading, register, login, loginWithGoogle, logout, updateUser }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
