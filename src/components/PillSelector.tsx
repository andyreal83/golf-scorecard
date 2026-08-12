import './PillSelector.css'

interface PillSelectorProps {
  label: string
  value: number
  options: number[]
  onChange: (value: number) => void
  /** Smaller controls for dense list contexts (Course Setup / Course Editor rows). */
  small?: boolean
}

/**
 * A row of numbered pills for one-tap selection (used for par and stroke
 * index). Shows a compact ±1 stepper instead of listing every option when
 * the range is large (stroke index 1-18), since 18 pills won't fit legibly
 * on a phone screen.
 */
export default function PillSelector({ label, value, options, onChange, small }: PillSelectorProps) {
  const useStepper = options.length > 6
  const min = options[0]
  const max = options[options.length - 1]

  return (
    <div className={`pill-selector${small ? ' pill-selector--small' : ''}`}>
      <span className="pill-selector__label">{label}</span>
      {useStepper ? (
        <div className="pill-selector__stepper">
          <button
            type="button"
            className="button button--secondary"
            aria-label={`Decrease ${label}`}
            onClick={() => onChange(value <= min ? max : value - 1)}
          >
            −
          </button>
          <span className="pill-selector__value">{value}</span>
          <button
            type="button"
            className="button button--secondary"
            aria-label={`Increase ${label}`}
            onClick={() => onChange(value >= max ? min : value + 1)}
          >
            +
          </button>
        </div>
      ) : (
        <div className="pill-selector__row">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              className={`pill-selector__pill${opt === value ? ' pill-selector__pill--active' : ''}`}
              onClick={() => onChange(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
