import { User } from '../models/User.js'

const USERNAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/

function sanitize(base) {
  let candidate = base.replace(/[^a-zA-Z0-9_]/g, '')

  // Must start with a letter — prepend one if it doesn't.
  if (!/^[a-zA-Z]/.test(candidate)) {
    candidate = `u${candidate}`
  }

  // Must be at least 3 chars.
  while (candidate.length < 3) {
    candidate += Math.floor(Math.random() * 10)
  }

  return candidate.slice(0, 20)
}

// Generates a unique, pattern-valid username from an email address (the
// local part before @), for accounts created via Google sign-in where no
// username is supplied. The user can rename it anytime from their profile.
export async function generateUniqueUsername(email) {
  const localPart = email.split('@')[0] ?? 'user'
  const base = sanitize(localPart)

  if (USERNAME_PATTERN.test(base) && !(await User.findOne({ username: base }))) {
    return base
  }

  // Append a random numeric suffix until we find something unused.
  for (let attempt = 0; attempt < 20; attempt++) {
    const suffix = Math.floor(1000 + Math.random() * 9000).toString()
    const candidate = `${base.slice(0, 20 - suffix.length)}${suffix}`

    if (USERNAME_PATTERN.test(candidate) && !(await User.findOne({ username: candidate }))) {
      return candidate
    }
  }

  throw new Error('Could not generate a unique username after several attempts.')
}
