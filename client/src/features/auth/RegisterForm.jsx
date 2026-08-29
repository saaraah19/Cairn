import { useState } from 'react'
import { useAuth } from './useAuth.js'
import { GoogleSignInButton } from './GoogleSignInButton.jsx'
import './authForms.css'

const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/

function validate({ name, email, username, password }) {
  const errors = {}

  if (!name.trim()) errors.name = 'Name is required.'

  if (!email.trim()) {
    errors.email = 'Email is required.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Enter a valid email address.'
  }

  if (!username.trim()) {
    errors.username = 'Username is required.'
  } else if (!USERNAME_PATTERN.test(username)) {
    errors.username =
      'Username must be 3-20 characters, start with a letter, and use only letters, numbers, or underscores.'
  }

  if (!password) {
    errors.password = 'Password is required.'
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters.'
  }

  return errors
}

export function RegisterForm({ onSwitchToLogin }) {
  const { register } = useAuth()
  const [fields, setFields] = useState({ name: '', email: '', username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(field) {
    return (e) => setFields((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError(null)

    const validationErrors = validate(fields)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await register(fields)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <h2>Create your account</h2>

      {formError && <div className="auth-form-error">{formError}</div>}

      <div className="auth-field">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          value={fields.name}
          onChange={handleChange('name')}
        />
        {errors.name && <span className="auth-field-error">{errors.name}</span>}
      </div>

      <div className="auth-field">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={handleChange('email')}
        />
        {errors.email && <span className="auth-field-error">{errors.email}</span>}
      </div>

      <div className="auth-field">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          value={fields.username}
          onChange={handleChange('username')}
        />
        <span className="auth-field-hint">
          3-20 characters. Start with a letter. Letters, numbers, and underscores only.
          You can change this later in your profile.
        </span>
        {errors.username && <span className="auth-field-error">{errors.username}</span>}
      </div>

      <div className="auth-field">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={fields.password}
          onChange={handleChange('password')}
        />
        <span className="auth-field-hint">At least 8 characters.</span>
        {errors.password && <span className="auth-field-error">{errors.password}</span>}
      </div>

      <button className="auth-submit" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>

      <div className="auth-divider">or</div>
      <GoogleSignInButton />

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin}>
          Log in
        </button>
      </p>
    </form>
  )
}
