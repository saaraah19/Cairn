import './BreakdownBarList.css'

// A simple proportional-bar breakdown — deliberately not a charting library.
// docs/03_UX_DESIGN_SPEC.md §29: "avoid presenting the page as a spreadsheet
// full of numbers... avoid unnecessary graphs."
export function BreakdownBarList({ items, labelKey, formatLabel }) {
  if (!items || items.length === 0) return null
  const max = Math.max(...items.map((i) => i.count))

  return (
    <div>
      {items.map((item) => (
        <div key={item[labelKey]} className="breakdown-row">
          <span className="breakdown-row-label">
            {formatLabel ? formatLabel(item[labelKey]) : item[labelKey]}
          </span>
          <span className="breakdown-row-track">
            <span
              className="breakdown-row-fill"
              style={{ width: `${(item.count / max) * 100}%` }}
            />
          </span>
          <span className="breakdown-row-count">{item.count}</span>
        </div>
      ))}
    </div>
  )
}
