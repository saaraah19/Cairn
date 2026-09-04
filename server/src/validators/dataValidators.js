import { z } from 'zod'

export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    message: 'Type DELETE exactly to confirm.',
  }),
  currentPassword: z.string().optional(),
})
