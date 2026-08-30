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

const trailSchema = z
  .object({
    distanceKm: z.number().min(0).nullable().optional(),
    durationMinutes: z.number().min(0).nullable().optional(),
    maxAltitudeM: z.number().nullable().optional(),
    elevationGainM: z.number().min(0).nullable().optional(),
    elevationLossM: z.number().min(0).nullable().optional(),
    difficulty: z.enum(['easy', 'moderate', 'hard', 'very_hard']).nullable().optional(),
  })
  .optional()

const conditionsSchema = z
  .object({
    weather: z
      .enum(['sunny', 'cloudy', 'rainy', 'windy', 'snowy', 'foggy', 'other'])
      .nullable()
      .optional(),
    temperatureC: z.number().min(-90).max(60).nullable().optional(),
    trailCondition: z.enum(['dry', 'muddy', 'wet', 'snowy', 'rocky', 'other']).nullable().optional(),
  })
  .optional()

const socialSchema = z
  .object({
    groupId: z.string().nullable().optional(),
    companions: z.array(z.string().trim().max(100)).max(30).optional(),
  })
  .optional()

const reviewSchema = z
  .object({
    rating: z.number().min(0).max(10).nullable().optional(),
    challenges: z.string().trim().max(2000).optional(),
    notes: z.string().trim().max(5000).optional(),
  })
  .optional()

const baseActivityFields = {
  name: z.string().trim().min(1, 'Name is required').max(150),
  type: z.enum(['hiking', 'trekking', 'camping']).optional(),
  date: isoDateString,
  location: locationSchema,
  trail: trailSchema,
  conditions: conditionsSchema,
  social: socialSchema,
  costDzd: z.number().min(0).nullable().optional(),
  review: reviewSchema,
  destinationId: z.string().nullable().optional(),
  visibility: z.enum(['private', 'public']).optional(),
}

export const createActivitySchema = z.object(baseActivityFields)

// Same shape, but every top-level field is optional for partial updates.
export const updateActivitySchema = z.object(baseActivityFields).partial()

export const listActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  search: z.string().trim().max(150).optional(),
  type: z.enum(['hiking', 'trekking', 'camping']).optional(),
  difficulty: z.enum(['easy', 'moderate', 'hard', 'very_hard']).optional(),
  wilaya: z.string().trim().max(100).optional(),
  groupId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  sort: z.enum(['newest', 'oldest', 'distance', 'rating', 'elevation']).optional().default('newest'),
})
