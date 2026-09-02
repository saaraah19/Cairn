import { useState } from 'react'
import { useAuth } from '../auth/useAuth.js'
import { useTheme } from '../theme/useTheme.js'
import {
  updateProfileRequest,
  changePasswordRequest,
  uploadProfilePictureRequest,
  removeProfilePictureRequest,
} from './api.js'
import '../activities/ActivityForm.css'
import '../auth/authForms.css'
import '../../pages/pages.css'
import './ProfileSettingsPage.css'

function ProfilePictureSection({ user, onUpdated }) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSelect(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      const data = await uploadProfilePictureRequest(file)
      onUpdated(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemove() {
    setIsUploading(true)
    setError(null)
    try {
      const data = await removeProfilePictureRequest()
      onUpdated(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <section className="form-section">
      <h2>Picture</h2>
      <div className="profile-picture-row">
        <div
          className="profile-picture-circle"
          style={
            user.profilePicture?.secureUrl
              ? { backgroundImage: `url(${user.profilePicture.secureUrl})` }
              : undefined
          }
        >
          {!user.profilePicture?.secureUrl && (isUploading ? '…' : 'No photo')}
        </div>
        <div className="profile-picture-actions">
          <label className="secondary-action">
            {user.profilePicture?.secureUrl ? 'Replace' : 'Upload'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleSelect}
              disabled={isUploading}
            />
          </label>
          {user.profilePicture?.secureUrl && (
            <button className="secondary-action" onClick={handleRemove} disabled={isUploading}>
              Remove
            </button>
          )}
        </div>
      </div>
      {error && <div className="auth-form-error">{error}</div>}
    </section>
  )
}

function ProfileInfoSection({ user, onUpdated }) {
  const [form, setForm] = useState({
    name: user.name ?? '',
    username: user.username ?? '',
    bio: user.bio ?? '',
    location: user.location ?? '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setSaved(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      const data = await updateProfileRequest(form)
      onUpdated(data.user)
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form className="form-section" onSubmit={handleSubmit}>
      <h2>Profile</h2>
      {error && <div className="auth-form-error">{error}</div>}
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="name">Name</label>
          <input id="name" value={form.name} onChange={set('name')} required />
        </div>
        <div className="form-field">
          <label htmlFor="username">Username</label>
          <input id="username" value={form.username} onChange={set('username')} required />
        </div>
        <div className="form-field span-2">
          <label htmlFor="bio">Bio</label>
          <textarea id="bio" value={form.bio} onChange={set('bio')} />
        </div>
        <div className="form-field">
          <label htmlFor="location">Location</label>
          <input id="location" value={form.location} onChange={set('location')} />
        </div>
      </div>
      <div className="form-actions" style={{ marginTop: 'var(--space-sm)' }}>
        <button className="primary-action" type="submit" disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save profile'}
        </button>
        {saved && <span className="settings-save-note">Saved.</span>}
      </div>
    </form>
  )
}

function AccountSection({ user }) {
  const hasPassword = user.authProviders?.includes('password')
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  function set(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }))
      setSaved(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setIsSaving(true)
    try {
      await changePasswordRequest(form)
      setForm({ currentPassword: '', newPassword: '' })
      setSaved(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="form-section">
      <h2>Account</h2>
      <div className="form-grid">
        <div className="form-field">
          <label>Email</label>
          <input value={user.email} disabled />
        </div>
        <div className="form-field">
          <label>Signed in with</label>
          <div className="settings-providers">
            {user.authProviders?.map((p) => (
              <span key={p} className="provider-pill">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-sm)' }}>
          {hasPassword ? 'Change password' : 'Set a password'}
        </h3>
        {!hasPassword && (
          <p className="auth-field-hint" style={{ marginBottom: 'var(--space-sm)' }}>
            Your account currently signs in with Google only. Set a password to also enable
            email/password sign-in.
          </p>
        )}
        {error && <div className="auth-form-error">{error}</div>}
        <div className="form-grid">
          {hasPassword && (
            <div className="form-field">
              <label htmlFor="currentPassword">Current password</label>
              <input
                id="currentPassword"
                type="password"
                value={form.currentPassword}
                onChange={set('currentPassword')}
              />
            </div>
          )}
          <div className="form-field">
            <label htmlFor="newPassword">{hasPassword ? 'New password' : 'Password'}</label>
            <input
              id="newPassword"
              type="password"
              value={form.newPassword}
              onChange={set('newPassword')}
            />
          </div>
        </div>
        <div className="form-actions" style={{ marginTop: 'var(--space-sm)' }}>
          <button className="primary-action" type="submit" disabled={isSaving}>
            {isSaving ? 'Saving…' : hasPassword ? 'Change password' : 'Set password'}
          </button>
          {saved && <span className="settings-save-note">Password updated.</span>}
        </div>
      </form>
    </section>
  )
}

function AppearanceSection() {
  const { preference, setPreference } = useTheme()

  return (
    <section className="form-section">
      <h2>Appearance</h2>
      <div className="radio-row">
        {['light', 'dark', 'system'].map((opt) => (
          <label key={opt}>
            <input
              type="radio"
              name="theme"
              value={opt}
              checked={preference === opt}
              onChange={() => setPreference(opt)}
            />
            {opt[0].toUpperCase() + opt.slice(1)}
          </label>
        ))}
      </div>
    </section>
  )
}

function PrivacySection({ user, onUpdated }) {
  const [value, setValue] = useState(user.preferences?.defaultActivityVisibility ?? 'private')
  const [isSaving, setIsSaving] = useState(false)

  async function handleChange(next) {
    setValue(next)
    setIsSaving(true)
    try {
      const data = await updateProfileRequest({ preferences: { defaultActivityVisibility: next } })
      onUpdated(data.user)
    } catch {
      // Non-critical preference — silently keep the local UI state; the
      // person can just try again from the same control.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="form-section">
      <h2>Privacy</h2>
      <p className="auth-field-hint" style={{ marginBottom: 'var(--space-sm)' }}>
        Default visibility for new activities you log.
      </p>
      <div className="radio-row">
        {['private', 'public'].map((opt) => (
          <label key={opt}>
            <input
              type="radio"
              name="defaultVisibility"
              value={opt}
              checked={value === opt}
              disabled={isSaving}
              onChange={() => handleChange(opt)}
            />
            {opt[0].toUpperCase() + opt.slice(1)}
          </label>
        ))}
      </div>
    </section>
  )
}

function DataSection() {
  return (
    <section className="form-section">
      <h2>Data</h2>
      <p className="auth-field-hint">
        Exporting your data and account deletion are coming in a future update.
      </p>
    </section>
  )
}

export function ProfileSettingsPage() {
  const { user, logout, updateUser } = useAuth()

  if (!user) return null

  return (
    <div>
      <div className="page-header">
        <h1>Profile & Settings</h1>
      </div>

      <div className="activity-form" style={{ maxWidth: 640 }}>
        <ProfilePictureSection user={user} onUpdated={updateUser} />
        <ProfileInfoSection user={user} onUpdated={updateUser} />
        <AccountSection user={user} />
        <AppearanceSection />
        <PrivacySection user={user} onUpdated={updateUser} />
        <DataSection />

        <button className="logout-button" onClick={logout}>
          Log out
        </button>
      </div>
    </div>
  )
}
