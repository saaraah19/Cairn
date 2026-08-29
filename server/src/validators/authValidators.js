import { z } from 'zod'

// Username rule: 3-20 chars, letters/numbers/underscore only, must start with a letter.
const usernamePattern = /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      usernamePattern,
      'Username must be 3-20 characters, start with a letter, and contain only letters, numbers, or underscores'
    ),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'), // bcrypt's practical limit
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
