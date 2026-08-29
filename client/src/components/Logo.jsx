// The signature element: an abstract stacked-stone cairn mark. Four simple
// irregular shapes rather than a literal illustration, per the approved
// Phase 2 design direction — this is the one place visual "boldness" lives;
// everything else in the interface stays quiet.
export function CairnMark({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <ellipse cx="16" cy="27.5" rx="10" ry="2.4" fill="var(--color-moss)" opacity="0.55" />
      <path d="M8 22.5c0-1.4 1.4-2.4 3.2-2.6l9.6-1c1.9-.2 3.4.9 3.4 2.3v.8c0 1.3-1.5 2.3-3.3 2.3H11c-1.7 0-3-1-3-2.2z" fill="var(--color-moss)" />
      <path d="M11 15.8c0-1.1 1-2 2.5-2.2l6-.7c1.5-.2 2.7.7 2.7 1.9v.6c0 1.1-1.2 2-2.7 2h-6c-1.4 0-2.5-.8-2.5-1.9z" fill="var(--color-moss-deep)" />
      <path d="M14 9.5c0-.9.8-1.6 1.9-1.7l1.6-.2c1.1-.1 2 .5 2 1.4v.4c0 .8-.9 1.5-2 1.5h-1.6c-1 0-1.9-.6-1.9-1.4z" fill="var(--color-clay)" />
    </svg>
  )
}

export function Wordmark({ withLabel = true }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        fontSize: '1.15rem',
        color: 'var(--color-ink)',
      }}
    >
      <CairnMark />
      {withLabel && 'Cairn'}
    </span>
  )
}
