export function formatWeight(grams) {
  if (grams == null) return null
  if (grams >= 1000) return `${(grams / 1000).toFixed(grams % 1000 === 0 ? 0 : 1)} kg`
  return `${grams} g`
}

export function formatPrice(dzd) {
  if (dzd == null) return null
  return `${dzd.toLocaleString()} DZD`
}

export function formatPurchaseDate(dateString) {
  if (!dateString) return null
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
}

export const CATEGORY_LABELS = {
  clothing: 'Clothing',
  footwear: 'Footwear',
  backpack: 'Backpack',
  shelter: 'Shelter',
  sleeping: 'Sleeping',
  cooking: 'Cooking',
  hydration: 'Hydration',
  navigation: 'Navigation',
  lighting: 'Lighting',
  safety: 'Safety',
  accessories: 'Accessories',
  other: 'Other',
}

export const CONDITION_LABELS = {
  new: 'New',
  good: 'Good',
  worn: 'Worn',
  needs_repair: 'Needs repair',
  retired: 'Retired',
}
