// Two additions to the icon set for the landing page's feature grid. Same
// hand-rolled, single-weight line convention as NavIcons.jsx — kept in a
// separate file since these are marketing-surface icons, not navigation
// icons, even though they share a visual language.
const common = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function PlanIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...common} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4l2.6 1.6" />
    </svg>
  )
}

export function DestinationIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" {...common} {...props}>
      <path d="M12 21s-6.5-6.1-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.9-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </svg>
  )
}
