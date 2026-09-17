import { GearWishlistItem } from '../models/GearWishlistItem.js'
import { GearItem } from '../models/GearItem.js'
import { ApiError } from '../utils/apiResponse.js'

// Always 404s rather than leaking existence to another user, matching
// the codebase's existing ownership-check convention (see e.g.
// gearService.js's getOwnedGear, activityService.js's getOwnedActivity).
export async function getOwnedWishlistItem(userId, wishlistItemId) {
  const item = await GearWishlistItem.findOne({ _id: wishlistItemId, userId })
  if (!item) {
    throw new ApiError(404, 'NOT_FOUND', 'Wishlist item not found.')
  }
  return item
}

export async function createWishlistItem(userId, data) {
  return GearWishlistItem.create({ ...data, userId, options: [] })
}

export async function listWishlistItems(userId, { isPurchased, category } = {}) {
  const filter = { userId }
  // Coerced by the validator to an actual boolean or left undefined
  // (meaning "don't filter by purchase status at all") — the default
  // "Gear I Need to Buy" view should show only NOT-yet-purchased items,
  // matching its own name, but a purchase-history view of everything
  // (including already-purchased ones) should also be reachable.
  if (isPurchased !== undefined) filter.isPurchased = isPurchased
  if (category) filter.category = category

  return GearWishlistItem.find(filter).sort({ createdAt: -1 })
}

export async function updateWishlistItem(userId, wishlistItemId, data) {
  const item = await getOwnedWishlistItem(userId, wishlistItemId)
  Object.assign(item, data)
  await item.save()
  return item
}

export async function deleteWishlistItem(userId, wishlistItemId) {
  const item = await getOwnedWishlistItem(userId, wishlistItemId)
  // Does NOT touch the linked GearItem if this item was already purchased
  // — deleting the wishlist record is just removing the "I was
  // considering this" note, never the actual owned gear it may have
  // produced. Mirrors the codebase's existing rule that deleting an
  // Activity never deletes the GearItems it referenced (§40).
  await GearWishlistItem.deleteOne({ _id: item._id })
}

export async function addOption(userId, wishlistItemId, optionData) {
  const item = await getOwnedWishlistItem(userId, wishlistItemId)
  item.options.push(optionData)
  await item.save()
  return item
}

function findOption(item, optionId) {
  const option = item.options.id(optionId)
  if (!option) {
    throw new ApiError(404, 'NOT_FOUND', 'Option not found.')
  }
  return option
}

export async function updateOption(userId, wishlistItemId, optionId, optionData) {
  const item = await getOwnedWishlistItem(userId, wishlistItemId)
  const option = findOption(item, optionId)
  Object.assign(option, optionData)
  await item.save()
  return item
}

export async function deleteOption(userId, wishlistItemId, optionId) {
  const item = await getOwnedWishlistItem(userId, wishlistItemId)
  findOption(item, optionId) // throws 404 if it doesn't exist, before mutating anything
  item.options.pull(optionId)
  await item.save()
  return item
}

// The one meaningfully different piece of this feature: unlike
// PlannedActivity->Activity completion (where the client creates the
// Activity themselves via the normal form, then merely LINKS it), the
// product owner was explicit that marking an option Purchased should
// "transformer/ajouter directement" — transform/add it directly — into
// the Gear Closet in one action, with fields pre-filled. So this
// atomically creates the GearItem AND updates the wishlist item, rather
// than requiring a separate manual gear-creation step first.
//
// The resulting GearItem's NAME comes from the OPTION (e.g. "SIMOND
// MT500 Blue"), not the wishlist item's general name (e.g. "Sleeping
// Mat") — the option is the specific product actually bought, and using
// the generic article name would make multiple purchases over time
// indistinguishable in the Gear Closet, which GearItem's own design
// explicitly guards against (docs/05_DATA_MODEL_AND_API_CONTRACT.md §30).
//
// An already-purchased wishlist item cannot be purchased again — a
// wishlist item converts into exactly one GearItem, not several.
export async function purchaseOption(userId, wishlistItemId, optionId) {
  const item = await getOwnedWishlistItem(userId, wishlistItemId)

  if (item.isPurchased) {
    throw new ApiError(409, 'ALREADY_PURCHASED', 'This wishlist item has already been purchased.')
  }

  const option = findOption(item, optionId)

  const gearItem = await GearItem.create({
    userId,
    name: option.name,
    category: item.category,
    store: option.store,
    purchasePriceDzd: option.priceDzd,
    productUrl: option.productUrl,
    notes: option.notes,
    purchaseDate: new Date(),
  })

  item.isPurchased = true
  item.purchasedOptionId = option._id
  item.purchasedGearItemId = gearItem._id
  await item.save()

  return { wishlistItem: item, gearItem }
}
