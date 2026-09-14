// Forgot-Password / Reset-Password: mocked unit verification.
//
// Same sandbox limitation as the Community test suite (no MongoDB
// reachable here). Property under test, per 07_POST_V1_ROADMAP.md §A2:
// the endpoint never reveals whether an email exists or is Google-only
// (no enumeration); a raw reset token is never stored, only its hash; an
// expired or unknown token is rejected; a successful reset is single-use
// (the same token can never be used twice); mailService is never actually
// invoked for an account with no password to reset.
//
// Usage: node scripts/test-auth-reset-password-unit.js

import crypto from 'node:crypto'
import { User } from '../src/models/User.js'
import { requestPasswordReset, resetPassword } from '../src/services/authService.js'
import { mailService } from '../src/services/mailService.js'

let failures = 0
function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`)
    failures += 1
  } else {
    console.log(`✓ ${message}`)
  }
}

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

let users
let sentEmails

function resetFixtures() {
  users = [
    {
      _id: 'user-1',
      email: 'has-password@example.com',
      passwordHash: 'existing-hash',
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      save: async function () {},
    },
    {
      _id: 'user-2',
      email: 'google-only@example.com',
      passwordHash: null,
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      save: async function () {},
    },
  ]
  sentEmails = []
}

function installMocks() {
  User.findOne = (filter) => {
    if (filter.email) {
      return Promise.resolve(users.find((u) => u.email === filter.email) ?? null)
    }
    if (filter.passwordResetTokenHash) {
      const found = users.find(
        (u) =>
          u.passwordResetTokenHash === filter.passwordResetTokenHash &&
          u.passwordResetExpiresAt &&
          u.passwordResetExpiresAt.getTime() > filter.passwordResetExpiresAt.$gt.getTime()
      )
      return Promise.resolve(found ?? null)
    }
    return Promise.resolve(null)
  }

  mailService.sendPasswordResetEmail = async (to, url) => {
    sentEmails.push({ to, url })
  }
}

async function run() {
  console.log('=== Forgot-Password / Reset-Password: mocked unit verification ===\n')
  installMocks()

  // 1. Requesting a reset for an account that has a password sends an
  //    email and sets a hashed token + expiry — never the raw token.
  resetFixtures()
  await requestPasswordReset('has-password@example.com')
  const user1 = users[0]
  assert(sentEmails.length === 1, 'An email is sent for an account with a password')
  assert(sentEmails[0].to === 'has-password@example.com', 'The email goes to the correct address')
  assert(user1.passwordResetTokenHash !== null, 'A token hash is stored on the user')
  assert(user1.passwordResetExpiresAt instanceof Date, 'An expiry is stored on the user')
  assert(
    !sentEmails[0].url.includes(user1.passwordResetTokenHash),
    'The RAW token in the email URL is never the same string as the stored HASH'
  )

  // 2. Requesting a reset for a Google-only account (no passwordHash)
  //    sends NO email and sets NO token — silently, not visibly.
  resetFixtures()
  await requestPasswordReset('google-only@example.com')
  assert(sentEmails.length === 0, 'No email is sent for a Google-only account with no password')
  assert(users[1].passwordResetTokenHash === null, 'No token is generated for a Google-only account')

  // 3. Requesting a reset for a nonexistent email sends no email either —
  //    and, critically, the CALLER (authController.forgotPassword) never
  //    even inspects this return value, so there is no way for the
  //    generic response to differ based on it.
  resetFixtures()
  const nonexistentResult = await requestPasswordReset('nobody@example.com')
  assert(sentEmails.length === 0, 'No email is sent for a nonexistent account')
  assert(nonexistentResult.sent === false, 'The internal result correctly reflects nothing was sent (but the controller ignores this)')

  // 4. Resetting with a valid, unexpired token succeeds.
  resetFixtures()
  const freshUser1 = users[0]
  const rawToken = 'a-generated-raw-token-value'
  freshUser1.passwordResetTokenHash = hashToken(rawToken)
  freshUser1.passwordResetExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
  const originalHash = freshUser1.passwordHash
  await resetPassword(rawToken, 'brandNewPassword123')
  assert(freshUser1.passwordHash !== originalHash, "The user's passwordHash actually changed")
  assert(freshUser1.passwordResetTokenHash === null, 'The token is cleared after a successful reset (single-use)')
  assert(freshUser1.passwordResetExpiresAt === null, 'The expiry is cleared after a successful reset')

  // 5. The SAME token cannot be used a second time (already cleared).
  try {
    await resetPassword(rawToken, 'anotherPassword456')
    assert(false, 'Reusing an already-consumed token throws')
  } catch (err) {
    assert(err.status === 400, 'Reusing an already-consumed reset token throws 400')
  }

  // 6. An expired token is rejected even though the hash still matches.
  resetFixtures()
  const expiredUser1 = users[0]
  const expiredRawToken = 'an-expired-token-value'
  expiredUser1.passwordResetTokenHash = hashToken(expiredRawToken)
  expiredUser1.passwordResetExpiresAt = new Date(Date.now() - 60 * 1000) // 1 minute in the past
  try {
    await resetPassword(expiredRawToken, 'somePassword789')
    assert(false, 'Resetting with an expired token throws')
  } catch (err) {
    assert(err.status === 400, 'An expired reset token is rejected with 400, same as an unknown one')
  }

  // 7. A completely unknown/bogus token is rejected the same way.
  resetFixtures()
  try {
    await resetPassword('never-issued-token', 'somePassword000')
    assert(false, 'Resetting with a bogus token throws')
  } catch (err) {
    assert(err.status === 400, 'A bogus reset token is rejected with 400')
  }

  console.log(`\n${failures === 0 ? '✓ All forgot-password/reset-password checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
