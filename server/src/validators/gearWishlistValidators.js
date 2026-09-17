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

export const createWishlistItemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(150),
  category: z.enum(CATEGORIES).optional(),
  estimatedBudgetDzd: z.number().min(0).nullable().optional(),
  notes: z.string().trim().max(2000).optional(),
})

export const updateWishlistItemSchema = createWishlistItemSchema.partial()

export const listWishlistItemsQuerySchema = z.object({
  // Left unset (not defaulted to false) so "show me everything, including
  // already-purchased items" is reachable — the controller/service only
  // filters by purchase status when this is explicitly provided.
  isPurchased: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  category: z.enum(CATEGORIES).optional(),
})

export const optionSchema = z.object({
  name: z.string().trim().min(1, 'Option name is required').max(150),
  priceDzd: z.number().min(0).nullable().optional(),
  store: z.string().trim().max(150).optional(),
  productUrl: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
})

export const updateOptionSchema = optionSchema.partial()
