import { useState } from 'react'
import { forgotPasswordRequest } from './api.js'
import './authForms.css'

function validate({ email }) {
  const errors = {}
  if (!email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.'
  }
  return errors
}

export function ForgotPasswordForm({ onSwitchToLogin }) {
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Set on ANY successful submission, regardless of whether the email
  // actually matched an account — the backend's response is deliberately
  // generic (docs/07_POST_V1_ROADMAP.md §A2: no email enumeration), so the
  // UI has no more information than that to show either.
  const [isSubmitted, setIsSubmitted] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)

    const validationErrors = validate({ email })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await forgotPasswordRequest({ email: email.trim() })
      setIsSubmitted(true)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="auth-form">
        <h2>Check your email</h2>
        <p>If an account exists for {email.trim()}, we've sent a link to reset your password.</p>
        <p className="auth-switch">
          <button type="button" onClick={onSwitchToLogin}>
            Back to log in
          </button>
        </p>
      </div>
    )
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Reset your password</h2>
      <p>Enter your email and we'll send you a link to reset your password.</p>

      {formError && <div className="auth-form-error">{formError}</div>}

      <div className="auth-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <span className="auth-field-error">{errors.email}</span>}
      </div>

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Sending…' : 'Send reset link'}
      </button>

      <p className="auth-switch">
        Remembered your password?{' '}
        <button type="button" onClick={onSwitchToLogin}>
          Log in
        </button>
      </p>
    </form>
  )
}
