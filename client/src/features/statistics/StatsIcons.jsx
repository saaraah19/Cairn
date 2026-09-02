// Small line icons for the statistics highlight tiles, matching the same
// restrained single-weight style as components/NavIcons.jsx.
const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function CountIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...common} {...props}>
      <path d="M3 18 9 8l4 6.5L15 11l6 8H3Z" />
    </svg>
  )
}

export function DistanceIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...common} {...props}>
      <path d="M3 17c3 0 3-10 6-10s2 10 5 10 3-10 6-10" />
    </svg>
  )
}

export function DurationIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...common} {...props}>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9v4l2.5 2" />
      <path d="M9.5 2.5h5" />
    </svg>
  )
}

export function ElevationIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" {...common} {...props}>
      <path d="M4 18 10 8l3 4.5L15 10l5 8" />
      <path d="M15 4h5v5" />
      <path d="M20 4 13 12" />
    </svg>
  )
}
