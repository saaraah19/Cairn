import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { resetPasswordRequest } from './api.js'
import './authForms.css'

function validate({ password, confirmPassword }) {
  const errors = {}
  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }
  if (confirmPassword !== password) {
    errors.confirmPassword = 'Passwords do not match.'
  }
  return errors
}

export function ResetPasswordForm({ onSwitchToLogin }) {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDone, setIsDone] = useState(false)

  if (!token) {
    return (
      <div className="auth-form">
        <h2>Invalid reset link</h2>
        <p>This password reset link is missing its token. Request a new one from the login page.</p>
        <p className="auth-switch">
          <button type="button" onClick={onSwitchToLogin}>
            Back to log in
          </button>
        </p>
      </div>
    )
  }

  if (isDone) {
    return (
      <div className="auth-form">
        <h2>Password updated</h2>
        <p>Your password has been reset. You can now log in with your new password.</p>
        <p className="auth-switch">
          <button type="button" onClick={onSwitchToLogin}>
            Log in
          </button>
        </p>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)

    const validationErrors = validate({ password, confirmPassword })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await resetPasswordRequest({ token, password })
      setIsDone(true)
    } catch {
      // A generic, reusable error message here — the backend intentionally
      // doesn't distinguish "expired" from "already used" from "bogus"
      // (all rejected the same way), so the UI shouldn't invent a more
      // specific story either.
      setFormError('This reset link is invalid or has expired. Request a new one from the login page.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Set a new password</h2>

      {formError && <div className="auth-form-error">{formError}</div>}

      <div className="auth-field">
        <label htmlFor="password">New password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <span className="auth-field-hint">At least 8 characters.</span>
        {errors.password && <span className="auth-field-error">{errors.password}</span>}
      </div>

      <div className="auth-field">
        <label htmlFor="confirmPassword">Confirm new password</label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {errors.confirmPassword && <span className="auth-field-error">{errors.confirmPassword}</span>}
      </div>

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
