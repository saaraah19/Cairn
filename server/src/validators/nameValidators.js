import { z } from 'zod'

// Shared by Group and Companion — both are just a user-owned name.
export const createNameSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
})
