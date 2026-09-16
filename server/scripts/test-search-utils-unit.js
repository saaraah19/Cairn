// searchUtils.js: mocked unit verification (pure functions, no DB needed).
//
// Property under test: escapeRegex neutralizes every regex special
// character so user input can never be interpreted as a pattern instead
// of a literal string; buildSearchFilter produces a case-insensitive
// substring match across multiple fields and returns null for
// empty/whitespace input so callers can skip it cleanly.
//
// Usage: node scripts/test-search-utils-unit.js

import { escapeRegex, buildSearchFilter } from '../src/utils/searchUtils.js'

let failures = 0
function assert(condition, message) {
  if (!condition) {
    console.error(`✗ FAIL: ${message}`)
    failures += 1
  } else {
    console.log(`✓ ${message}`)
  }
}

console.log('=== searchUtils.js: mocked unit verification ===\n')

// escapeRegex
const dangerousInputs = ['(', ')', '[', ']', '{', '}', '.', '*', '+', '?', '^', '$', '|', '\\']
for (const char of dangerousInputs) {
  let threw = false
  try {
    new RegExp(escapeRegex(char))
  } catch {
    threw = true
  }
  assert(!threw, `escapeRegex("${char}") produces a valid RegExp, not a syntax error`)
}
assert(
  new RegExp(escapeRegex('Cap (Blanc)')).test('Cap (Blanc)'),
  'An escaped pattern still matches the literal text it came from'
)
assert(
  !new RegExp(escapeRegex('Cap (Blanc)')).test('Cap XBlancX'),
  "An escaped pattern's parentheses are treated literally, not as a regex group"
)

// buildSearchFilter
assert(buildSearchFilter('', ['name']) === null, 'An empty search string returns null')
assert(buildSearchFilter('   ', ['name']) === null, 'A whitespace-only search string returns null')
assert(buildSearchFilter(undefined, ['name']) === null, 'An undefined search value returns null')

const filter = buildSearchFilter('sarah', ['name', 'username'])
assert(filter !== null, 'A real search string returns a filter object')
assert(Array.isArray(filter.$or) && filter.$or.length === 2, 'The filter has one $or clause per field')
assert(filter.$or[0].name instanceof RegExp, 'Each clause is a RegExp against its field')
assert(filter.$or[0].name.test('Sarah Ahmed'), 'The match is case-insensitive')
assert(filter.$or[0].name.test('sarah'), 'The match works on an exact-case match too')
assert(!filter.$or[0].name.test('Amel'), "The match doesn't fire on unrelated text")

const trimmedFilter = buildSearchFilter('  sarah  ', ['name'])
assert(trimmedFilter.$or[0].name.test('sarah'), 'Leading/trailing whitespace in the search input is trimmed before matching')

console.log(`\n${failures === 0 ? '✓ All searchUtils.js checks passed.' : `✗ ${failures} check(s) failed.`}`)
process.exit(failures === 0 ? 0 : 1)
