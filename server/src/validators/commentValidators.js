import { z } from 'zod'

// A 24-hex-char Mongo ObjectId string, or literal null/omitted for a
// top-level comment. Reused by both the create-comment and edit-comment
// routes (edit ignores this field entirely; harmless to allow it there).
const objectIdString = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id.')

export const createCommentSchema = z.object({
  text: z.string().trim().min(1, 'Comment cannot be empty.').max(1000, 'Comments are limited to 1000 characters.'),
  parentCommentId: objectIdString.nullable().optional(),
})

export const listCommentsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
})
