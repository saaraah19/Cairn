// Gear Wishlist ("Gear I Need to Buy"): mocked unit verification.
//
// Same sandbox limitation as the rest of this test suite (no MongoDB
// reachable here). Property under test, per 07_POST_V1_ROADMAP.md §C
// (product-owner request, 2026-09-14): a wishlist item can hold multiple
// comparable options; purchasing an option creates a real GearItem with
// fields pre-filled FROM THE OPTION (name, store, price) and the
// wishlist item's own category — never the wishlist item's generic name;
// an already-purchased wishlist item cannot be purchased a second time;
// deleting an option or a whole wishlist item never touches a GearItem a
// previous purchase already created; ownership is enforced the same way
// as every other owned resource (a 404, not a 403, for another user's
// wishlist item).
//
// Usage: node scripts/test-gear-wishlist-unit.js

import { GearWishlistItem } from '../src/models/GearWishlistItem.js'
import { GearItem } from '../src/models/GearItem.js'
import {
  createWishlistItem,
  listWishlistItems,
  getOwnedWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
  addOption,
  updateOption,
  deleteOption,
  purchaseOption,
} from '../src/services/gearWishlistService.js'

let failures = 0
function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`)
    failures += 1
  } else {
    console.log(`✓ ${message}`)
  }
}

let wishlistItems
let gearItems
let idCounter

function resetFixtures() {
  wishlistItems = []
  gearItems = []
  idCounter = 1
}

// A tiny in-memory stand-in for Mongoose's subdocument array behavior
// (.push, .id(), .pull()) — just enough for the service code to work
// against without a real MongoDB connection.
function makeOptionsArray(initial = []) {
  const arr = [...initial]
  arr.id = (optionId) => arr.find((o) => String(o._id) === String(optionId)) ?? null
  arr.pull = (optionId) => {
    const idx = arr.findIndex((o) => String(o._id) === String(optionId))
    if (idx !== -1) arr.splice(idx, 1)
  }
  return arr
}

function installMocks() {
  GearWishlistItem.create = async (doc) => {
    const item = {
      _id: `wish-${idCounter++}`,
      isPurchased: false,
      purchasedOptionId: null,
      purchasedGearItemId: null,
      ...doc,
      options: makeOptionsArray(doc.options ?? []),
      save: async function () {
        return this
      },
    }
    wishlistItems.push(item)
    return item
  }

  GearWishlistItem.findOne = (filter) => {
    const found = wishlistItems.find((w) => w._id === filter._id && w.userId === filter.userId)
    return Promise.resolve(found ?? null)
  }

  GearWishlistItem.find = (filter) => {
    const matched = wishlistItems.filter(
      (w) =>
        w.userId === filter.userId &&
        (filter.isPurchased === undefined || w.isPurchased === filter.isPurchased) &&
        (filter.category === undefined || w.category === filter.category)
    )
    return { sort: () => Promise.resolve(matched) }
  }

  GearWishlistItem.deleteOne = async (filter) => {
    wishlistItems = wishlistItems.filter((w) => w._id !== filter._id)
  }

  GearItem.create = async (doc) => {
    const item = { _id: `gear-${idCounter++}`, ...doc }
    gearItems.push(item)
    return item
  }
}

async function run() {
  console.log('=== Gear Wishlist: mocked unit verification ===\n')
  installMocks()

  // 1. Creating a wishlist item starts with an empty options array.
  resetFixtures()
  const sleepingMat = await createWishlistItem('user-1', { name: 'Sleeping Mat', category: 'sleeping', estimatedBudgetDzd: 8000 })
  assert(sleepingMat.options.length === 0, 'A new wishlist item starts with zero options')
  assert(sleepingMat.isPurchased === false, 'A new wishlist item starts unpurchased')

  // 2. Multiple comparable options can be added to the same item.
  await addOption('user-1', sleepingMat._id, { name: 'SIMOND MT500 Blue', priceDzd: 4000, store: 'Decathlon' })
  await addOption('user-1', sleepingMat._id, { name: 'Some Other Mat', priceDzd: 6500, store: 'Another Store' })
  assert(sleepingMat.options.length === 2, 'Two comparable options exist on the same wishlist item')

  // 3. Ownership is enforced with a 404 (not a 403) — same as every other
  //    owned resource in this codebase.
  try {
    await getOwnedWishlistItem('user-2', sleepingMat._id)
    assert(false, "Another user fetching this wishlist item throws")
  } catch (err) {
    assert(err.status === 404, "Another user's attempt to access this wishlist item throws 404, not 403")
  }

  // 4. Purchasing an option creates a real GearItem pre-filled from the
  //    OPTION (name, store, price), using the wishlist item's CATEGORY —
  //    never the wishlist item's own generic name.
  const cheaperOption = sleepingMat.options[0]
  const { wishlistItem: afterPurchase, gearItem } = await purchaseOption('user-1', sleepingMat._id, cheaperOption._id)
  assert(gearItem.name === 'SIMOND MT500 Blue', "The created GearItem's name comes from the OPTION, not the wishlist item's generic name")
  assert(gearItem.category === 'sleeping', "The created GearItem's category comes from the wishlist item")
  assert(gearItem.store === 'Decathlon', "The created GearItem's store comes from the purchased option")
  assert(gearItem.purchasePriceDzd === 4000, "The created GearItem's price comes from the purchased option")
  assert(afterPurchase.isPurchased === true, 'The wishlist item is marked purchased')
  assert(String(afterPurchase.purchasedGearItemId) === String(gearItem._id), 'The wishlist item links to the newly created GearItem')
  assert(String(afterPurchase.purchasedOptionId) === String(cheaperOption._id), 'The wishlist item records WHICH option was purchased')

  // 5. The wishlist item is NOT deleted after purchase — it remains as a
  //    record of the decision, mirroring PlannedActivity->Activity.
  const stillThere = await getOwnedWishlistItem('user-1', sleepingMat._id)
  assert(stillThere !== null, 'The wishlist item still exists after being purchased, not deleted')

  // 6. An already-purchased wishlist item cannot be purchased again, even
  //    with a different (unpurchased) option on the same item.
  try {
    await purchaseOption('user-1', sleepingMat._id, sleepingMat.options[1]._id)
    assert(false, 'Purchasing a second option on an already-purchased item throws')
  } catch (err) {
    assert(err.status === 409, 'Purchasing a second option on an already-purchased wishlist item throws 409')
  }
  assert(gearItems.length === 1, 'No second GearItem was created by the rejected second purchase attempt')

  // 7. Deleting an option never touches a GearItem a previous purchase
  //    already created.
  resetFixtures()
  const jacket = await createWishlistItem('user-1', { name: 'Winter Jacket', category: 'clothing' })
  await addOption('user-1', jacket._id, { name: 'Option A', priceDzd: 12000, store: 'Store A' })
  await addOption('user-1', jacket._id, { name: 'Option B', priceDzd: 15000, store: 'Store B' })
  const { gearItem: purchasedGear } = await purchaseOption('user-1', jacket._id, jacket.options[0]._id)
  await deleteOption('user-1', jacket._id, jacket.options[0]._id)
  assert(gearItems.some((g) => g._id === purchasedGear._id), 'Deleting the purchased option does NOT delete the GearItem it already produced')

  // 8. Deleting the whole wishlist item also never touches a GearItem a
  //    previous purchase already created.
  await deleteWishlistItem('user-1', jacket._id)
  assert(gearItems.some((g) => g._id === purchasedGear._id), 'Deleting the whole wishlist item does NOT delete a GearItem it already produced')
  assert(wishlistItems.find((w) => w._id === jacket._id) === undefined, 'The wishlist item itself is actually gone after deletion')

  // 9. Updating a wishlist item's own fields (not an option) works.
  resetFixtures()
  const gloves = await createWishlistItem('user-1', { name: 'Gloves', category: 'clothing', estimatedBudgetDzd: 3000 })
  const updated = await updateWishlistItem('user-1', gloves._id, { estimatedBudgetDzd: 3500 })
  assert(updated.estimatedBudgetDzd === 3500, "A wishlist item's own fields can be updated directly")

  // 9b. An individual OPTION's own fields (distinct from the wishlist
  //     item's fields above) can also be updated directly — e.g. the
  //     price changed since it was first noted.
  await addOption('user-1', gloves._id, { name: 'Warm Gloves', priceDzd: 2500, store: 'Store X' })
  const optionId = gloves.options[0]._id
  await updateOption('user-1', gloves._id, optionId, { priceDzd: 2200 })
  assert(gloves.options.id(optionId).priceDzd === 2200, "An individual option's own price can be updated directly")
  assert(gloves.options.id(optionId).name === 'Warm Gloves', "Updating one field on an option leaves its other fields untouched")

  // 10. listWishlistItems defaults to showing everything when no
  //     isPurchased filter is given, but can be scoped to only
  //     not-yet-purchased items (the default "Gear I Need to Buy" view).
  resetFixtures()
  await createWishlistItem('user-1', { name: 'Item A', category: 'other' })
  const itemB = await createWishlistItem('user-1', { name: 'Item B', category: 'other' })
  await addOption('user-1', itemB._id, { name: 'Opt', priceDzd: 1000, store: 'Store' })
  await purchaseOption('user-1', itemB._id, itemB.options[0]._id)

  const everything = await listWishlistItems('user-1', {})
  assert(everything.length === 2, 'With no filter, both purchased and unpurchased items are returned')

  const activeOnly = await listWishlistItems('user-1', { isPurchased: false })
  assert(activeOnly.length === 1, 'Filtering by isPurchased: false returns only the still-wanted item')
  assert(activeOnly[0].name === 'Item A', 'The correct item is the one still not purchased')

  console.log(`\n${failures === 0 ? '✓ All Gear Wishlist checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
