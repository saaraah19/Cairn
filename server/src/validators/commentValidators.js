import { z } from 'zod'

export const createCommentSchema = z.object({
  text: z.string().trim().min(1, 'Comment cannot be empty.').max(1000, 'Comments are limited to 1000 characters.'),
})

export const listCommentsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})
