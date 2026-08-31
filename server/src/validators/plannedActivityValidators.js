import { z } from 'zod'

const isoDateString = z.string().refine((v) => !Number.isNaN(Date.parse(v)), {
  message: 'Enter a valid date.',
})

const locationSchema = z
  .object({
    placeName: z.string().trim().max(150).optional(),
    wilaya: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .optional()

const socialSchema = z
  .object({
    groupId: z.string().nullable().optional(),
    companions: z.array(z.string().trim().max(100)).max(30).optional(),
  })
  .optional()

const baseFields = {
  name: z.string().trim().min(1, 'Name is required').max(150),
  type: z.enum(['hiking', 'trekking', 'camping']).optional(),
  plannedDate: isoDateString,
  destinationId: z.string().nullable().optional(),
  location: locationSchema,
  social: socialSchema,
  estimatedCostDzd: z.number().min(0).nullable().optional(),
  expectedDifficulty: z.enum(['easy', 'moderate', 'hard', 'very_hard']).nullable().optional(),
  notes: z.string().trim().max(2000).optional(),
  status: z.enum(['planned', 'ready', 'completed', 'cancelled']).optional(),
}

export const createPlannedActivitySchema = z.object(baseFields)
export const updatePlannedActivitySchema = z.object(baseFields).partial()

export const listPlannedActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  status: z.enum(['planned', 'ready', 'completed', 'cancelled']).optional(),
})

export const completePlannedActivitySchema = z.object({
  activityId: z.string().min(1, 'activityId is required'),
})
