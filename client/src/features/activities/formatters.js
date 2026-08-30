export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDuration(minutes) {
  if (minutes == null) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatDistance(km) {
  if (km == null) return null
  return `${km} km`
}

export function formatElevation(meters) {
  if (meters == null) return null
  return `+${meters} m`
}

export const DIFFICULTY_LABELS = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
  very_hard: 'Very Hard',
}

export const TYPE_LABELS = {
  hiking: 'Hiking',
  trekking: 'Trekking',
  camping: 'Camping',
}

export const WEATHER_LABELS = {
  sunny: 'Sunny',
  cloudy: 'Cloudy',
  rainy: 'Rainy',
  windy: 'Windy',
  snowy: 'Snowy',
  foggy: 'Foggy',
  other: 'Other',
}

export const TRAIL_CONDITION_LABELS = {
  dry: 'Dry',
  muddy: 'Muddy',
  wet: 'Wet',
  snowy: 'Snowy',
  rocky: 'Rocky',
  other: 'Other',
}
