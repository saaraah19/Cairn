// Shared free-text search helper. Previously, `search` params used
// MongoDB's `$text` operator (whole-word/stemmed matching, requiring a
// text index) while adjacent filters on the very same list — e.g.
// Activity's `wilaya` — used a plain substring RegExp. This produced a
// genuinely confusing inconsistency: searching "Blan" would match via the
// wilaya filter (substring) but NOT via the search box ($text doesn't do
// partial-word matching), even though both boxes look and feel like the
// same kind of search to a user. Standardized on substring regex
// everywhere instead — simpler, consistent, and sufficient at this app's
// scale (personal per-user lists, not a web-scale search problem), per
// docs/02_TECHNICAL_ARCHITECTURE.md §54's own preference for the simpler
// solution when both are otherwise valid.

// Escapes regex special characters in free-text user input before it's
// used to build a MongoDB RegExp filter — without this, a search value
// like "(" would throw an "Invalid regular expression" error, and certain
// patterns could otherwise behave as a user-controlled regex rather than
// a literal substring match.
export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Builds a case-insensitive substring match across multiple fields, e.g.
// buildSearchFilter('cap blanc', ['name', 'location.placeName']) ->
// { $or: [{ name: /cap blanc/i }, { location.placeName: /cap blanc/i }] }.
// Returns null for an empty/whitespace-only search so callers can skip
// adding it to their filter object entirely rather than checking twice.
export function buildSearchFilter(search, fields) {
  const trimmed = search?.trim()
  if (!trimmed) return null
  const pattern = new RegExp(escapeRegex(trimmed), 'i')
  return { $or: fields.map((field) => ({ [field]: pattern })) }
}
