import { useState } from 'react'
import { useAuth } from './useAuth.js'
import { GoogleSignInButton } from './GoogleSignInButton.jsx'
import './authForms.css'

export function LoginForm({ onSwitchToRegister }) {
  const { login } = useAuth()
  const [fields, setFields] = useState({ email: '', password: '' })
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(field) {
    return (e) => setFields((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)
    setIsSubmitting(true)
    try {
      await login(fields)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Log in</h2>

      {formError && <div className="auth-form-error">{formError}</div>}

      <div className="auth-field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={handleChange('email')}
        />
      </div>

      <div className="auth-field">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={fields.password}
          onChange={handleChange('password')}
        />
      </div>

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in…' : 'Log in'}
      </button>

      <div className="auth-divider">or</div>
      <GoogleSignInButton />

      <p className="auth-switch">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToRegister}>
          Create one
        </button>
      </p>
    </form>
  )
}
