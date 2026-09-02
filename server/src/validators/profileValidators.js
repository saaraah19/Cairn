import { z } from 'zod'

const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100).optional(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      usernamePattern,
      'Username must be 3-20 characters, start with a letter, and contain only letters, numbers, or underscores'
    )
    .optional(),
  bio: z.string().trim().max(500).optional(),
  location: z.string().trim().max(150).optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      defaultActivityVisibility: z.enum(['private', 'public']).optional(),
    })
    .optional(),
})

export const changePasswordSchema = z.object({
  // Optional: accounts with no password yet (Google-only) are "setting" a
  // password for the first time rather than "changing" one, and have
  // nothing to confirm. Enforced in the service layer, not here.
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(72),
})
