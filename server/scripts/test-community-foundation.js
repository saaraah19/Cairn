// M1 — Community Foundation verification.
//
// Unlike every other test-*.sh script in this folder, this one doesn't hit
// a running server over HTTP — M1 deliberately exposes no routes yet (see
// docs/08_COMMUNITY_PROPOSAL.md §13). Instead it calls the DTO builders
// directly against a fixture Activity/User with *every* private field
// populated, and asserts none of them appear anywhere in the output. This
// is the concrete test the proposal calls for at M1.
//
// Deliberately does not require a MongoDB connection: groupId/destinationId
// are left null in the fixture, so resolvePublicGroupName/
// resolvePublicDestination short-circuit without a DB lookup. This test's
// job is to prove the whitelist itself never leaks a private field, not to
// exercise the resolvers' DB-lookup behavior — that gets real end-to-end
// coverage once M2/M3 wire actual endpoints, following this folder's normal
// live-server test-*.sh convention.
//
// Usage: node scripts/test-community-foundation.js

import { toPublicActivityDTO, toPublicProfileDTO } from '../src/services/communityService.js'
import { create as createNotification } from '../src/services/notifyService.js'

let failures = 0

function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`)
    failures += 1
  } else {
    console.log(`✓ ${message}`)
  }
}

function assertAbsent(dto, forbiddenValue, fieldDescription) {
  const json = JSON.stringify(dto)
  assert(!json.includes(forbiddenValue), `${fieldDescription} does not appear anywhere in the public DTO`)
}

async function run() {
  console.log('=== M1 — Community Foundation: whitelist DTO verification ===\n')

  const fixtureActivity = {
    _id: 'activity-fixture-id',
    userId: 'author-user-id',
    activityNumber: 42, // must never appear publicly
    name: 'Cap Blanc Sunrise Hike',
    type: 'hiking',
    date: new Date('2026-08-24'),
    location: {
      placeName: 'Cap Blanc',
      wilaya: 'Oran',
      country: 'Algeria',
      latitude: 35.7331111, // must never appear publicly
      longitude: -0.7869999, // must never appear publicly
    },
    trail: {
      distanceKm: 12.4,
      durationMinutes: 260,
      maxAltitudeM: 210,
      elevationGainM: 640,
      elevationLossM: 630,
      difficulty: 'hard',
    },
    conditions: { weather: 'sunny', temperatureC: 24, trailCondition: 'dry' },
    social: {
      groupId: null, // resolver short-circuits without a DB call
      companions: ['SecretFriendNameXYZ'], // must never appear publicly
    },
    costDzd: 999999, // must never appear publicly
    review: {
      rating: 9,
      challenges: 'Steep final ascent',
      notes: 'PRIVATE_JOURNAL_TEXT_ONLY_FOR_ME', // must never appear publicly
    },
    destinationId: null,
    gearItemIds: ['gear-1', 'gear-2'], // must never appear publicly
    visibility: 'public',
    publicCaption: 'A beautiful sunrise start.',
    kudosCount: 3,
    createdAt: new Date('2026-08-24T06:00:00Z'),
  }

  const activityDTO = await toPublicActivityDTO(fixtureActivity)

  assertAbsent(activityDTO, '42', 'activityNumber (42)')
  assertAbsent(activityDTO, '35.7331111', 'exact latitude')
  assertAbsent(activityDTO, '-0.7869999', 'exact longitude')
  assertAbsent(activityDTO, 'SecretFriendNameXYZ', 'companion name')
  assertAbsent(activityDTO, '999999', 'costDzd')
  assertAbsent(activityDTO, 'PRIVATE_JOURNAL_TEXT_ONLY_FOR_ME', 'review.notes')
  assertAbsent(activityDTO, 'gear-1', 'gearItemIds')
  assert(activityDTO.publicCaption === 'A beautiful sunrise start.', 'publicCaption is exposed as its own field')
  assert(activityDTO.kudosCount === 3, 'kudosCount is exposed')
  assert(activityDTO.review.challenges === 'Steep final ascent', 'review.challenges is exposed (public-eligible)')
  assert(activityDTO.review.notes === undefined, 'review.notes key is not present at all in the DTO')

  console.log('')

  const fixtureUser = {
    _id: 'user-fixture-id',
    email: 'secret@example.com', // must never appear publicly
    passwordHash: 'HASHED_PASSWORD_VALUE', // must never appear publicly
    googleId: 'google-oauth-id-123', // must never appear publicly
    authProviders: ['password'],
    name: 'Amel Belkacem',
    username: 'amelb',
    profilePicture: { secureUrl: 'https://res.cloudinary.com/demo/image/upload/amel.jpg' },
    bio: 'Weekend hiker.',
    location: 'Oran',
    preferences: { theme: 'dark', defaultActivityVisibility: 'private' }, // must never appear publicly
    isPublicProfile: true,
  }

  const profileDTO = toPublicProfileDTO(fixtureUser)

  assertAbsent(profileDTO, 'secret@example.com', 'email')
  assertAbsent(profileDTO, 'HASHED_PASSWORD_VALUE', 'passwordHash')
  assertAbsent(profileDTO, 'google-oauth-id-123', 'googleId')
  assertAbsent(profileDTO, 'dark', 'preferences (theme)')
  assert(profileDTO.username === 'amelb', 'username is exposed')
  assert(profileDTO.bio === 'Weekend hiker.', 'bio is exposed')

  console.log('')

  // notifyService.create() — self-notification suppression, no DB needed
  // to prove the guard (it returns before ever calling Notification.create).
  const selfNotification = await createNotification({
    recipientUserId: 'user-1',
    actorUserId: 'user-1',
    type: 'kudos',
    activityId: 'activity-1',
  })
  assert(selfNotification === null, 'notifyService.create() suppresses self-notifications (returns null, no write attempted)')

  console.log(`\n${failures === 0 ? '✓ All M1 foundation checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
