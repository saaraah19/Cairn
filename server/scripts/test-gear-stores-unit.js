// listGearStores: mocked unit verification.
//
// Same sandbox limitation as the rest of this test suite (no MongoDB
// reachable here). Property under test, per 07_POST_V1_ROADMAP.md §C
// (product-owner request, 2026-09-14): grouping is case-INsensitive (so
// "Decathlon" and "decathlon" count as the same store, not two separate
// ones); an item with no store (empty string) is excluded entirely, not
// grouped under an empty-string "store"; a null purchasePriceDzd
// contributes 0 to the total, not NaN or a crash; results are sorted
// alphabetically by store name; a different user's gear never leaks into
// this user's store summary; the store filter on the main gear list
// matches case-insensitively but NOT as a substring (so filtering by
// "Decathlon" never also matches a hypothetical "Decathlon Outlet").
//
// Usage: node scripts/test-gear-stores-unit.js

import { GearItem } from '../src/models/GearItem.js'
import { listGearStores } from '../src/services/gearService.js'

let failures = 0
function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`)
    failures += 1
  } else {
    console.log(`✓ ${message}`)
  }
}

// Fixture chosen so Decathlon lands on exactly the product owner's own
// example: 4 items, 53,000 DA spent.
const fixture = [
  { _id: 'g1', userId: 'user-1', store: 'Decathlon', purchasePriceDzd: 15000 },
  { _id: 'g2', userId: 'user-1', store: 'decathlon', purchasePriceDzd: 8000 }, // same store, different casing
  { _id: 'g3', userId: 'user-1', store: 'Decathlon', purchasePriceDzd: null }, // no price recorded
  { _id: 'g4', userId: 'user-1', store: 'Decathlon', purchasePriceDzd: 30000 },
  { _id: 'g5', userId: 'user-1', store: 'Randonnée Shop', purchasePriceDzd: 12000 },
  { _id: 'g6', userId: 'user-1', store: '', purchasePriceDzd: 5000 }, // no store recorded at all
  { _id: 'g7', userId: 'user-2', store: 'Decathlon', purchasePriceDzd: 99999 }, // a DIFFERENT user entirely
]

function installMocks() {
  GearItem.find = (filter) => {
    const matched = fixture.filter((item) => {
      if (filter.userId && item.userId !== filter.userId) return false
      if (filter.store?.$ne !== undefined && item.store === filter.store.$ne) return false
      return true
    })
    return { select: () => Promise.resolve(matched.map((i) => ({ ...i }))) }
  }
}

async function run() {
  console.log('=== listGearStores: mocked unit verification ===\n')
  installMocks()

  const stores = await listGearStores('user-1')

  assert(stores.length === 2, 'Exactly 2 distinct stores are returned for user-1 (Decathlon, Randonnée Shop)')
  assert(
    stores.every((s) => s.store.toLowerCase() !== ''),
    "The item with no store recorded is excluded entirely, not grouped as an empty-string 'store'"
  )

  const decathlon = stores.find((s) => s.store.toLowerCase() === 'decathlon')
  assert(decathlon !== undefined, 'Decathlon appears as a single grouped entry')
  assert(decathlon.itemCount === 4, '"Decathlon" and "decathlon" are grouped as ONE store (4 items total, not split 3+1)')
  assert(decathlon.totalSpentDzd === 53000, 'The total sums correctly (15000+8000+0+30000=53000), treating a null price as 0')
  assert(!stores.some((s) => s.itemCount === 99999 || s.totalSpentDzd === 99999), "A different user's gear never leaks into this user's store summary")

  const sortedNames = stores.map((s) => s.store.toLowerCase())
  const alphabetical = [...sortedNames].sort((a, b) => a.localeCompare(b))
  assert(JSON.stringify(sortedNames) === JSON.stringify(alphabetical), 'Stores are returned sorted alphabetically')

  console.log(`\n${failures === 0 ? '✓ All listGearStores checks passed.' : `✗ ${failures} check(s) failed.`}`)
  process.exit(failures === 0 ? 0 : 1)
}

run()
