import { z } from 'zod'

const locationSchema = z
  .object({
    placeName: z.string().trim().max(150).optional(),
    wilaya: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .optional()

const baseFields = {
  name: z.string().trim().min(1, 'Name is required').max(150),
  location: locationSchema,
  status: z.enum(['wishlist', 'planned', 'visited']).optional(),
  targetDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Enter a valid date.' })
    .nullable()
    .optional(),
  description: z.string().trim().max(2000).optional(),
  notes: z.string().trim().max(2000).optional(),
  links: z.array(z.string().trim().max(500)).max(20).optional(),
}

export const createDestinationSchema = z.object(baseFields)
export const updateDestinationSchema = z.object(baseFields).partial()

export const listDestinationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  search: z.string().trim().max(150).optional(),
  status: z.enum(['wishlist', 'planned', 'visited']).optional(),
})
