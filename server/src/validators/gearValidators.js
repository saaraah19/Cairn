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
  // 200, not 50: the activity-logging and Pack My Bag gear PICKERS fetch
  // with a single request (no pagination UI inside a picker) so they can
  // filter/search client-side across the whole closet at once — a cap of
  // 50 meant anyone with more gear than that silently couldn't select or
  // pack their remaining items. 200 comfortably covers even a very
  // thorough gear closet; the main Gear Closet PAGE still paginates
  // normally with the smaller default below.
  limit: z.coerce.number().int().min(1).max(200).optional().default(20),
  search: z.string().trim().max(150).optional(),
  category: z.enum(CATEGORIES).optional(),
  store: z.string().trim().max(150).optional(),
})
