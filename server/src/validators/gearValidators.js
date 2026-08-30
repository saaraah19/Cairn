import { z } from 'zod'

const CATEGORIES = [
  'clothing',
  'footwear',
  'backpack',
  'shelter',
  'sleeping',
  'cooking',
  'hydration',
  'navigation',
  'lighting',
  'safety',
  'accessories',
  'other',
]

const baseGearFields = {
  name: z.string().trim().min(1, 'Name is required').max(150),
  category: z.enum(CATEGORIES).optional(),
  brand: z.string().trim().max(100).optional(),
  model: z.string().trim().max(100).optional(),
  quantity: z.number().int().min(1).optional(),
  weightGrams: z.number().min(0).nullable().optional(),
  purchaseDate: z
    .string()
    .refine((v) => !Number.isNaN(Date.parse(v)), { message: 'Enter a valid date.' })
    .nullable()
    .optional(),
  purchasePriceDzd: z.number().min(0).nullable().optional(),
  condition: z.enum(['new', 'good', 'worn', 'needs_repair', 'retired']).nullable().optional(),
  store: z.string().trim().max(150).optional(),
  productUrl: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
}

export const createGearSchema = z.object(baseGearFields)
export const updateGearSchema = z.object(baseGearFields).partial()

export const listGearQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  search: z.string().trim().max(150).optional(),
  category: z.enum(CATEGORIES).optional(),
})
