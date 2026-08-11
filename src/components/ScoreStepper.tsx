import './ScoreStepper.css'

interface ScoreStepperProps {
  playerName: string
  netPar: number
  score: number | undefined
  onChange: (delta: number) => void
}

export default function ScoreStepper({ playerName, netPar, score, onChange }: ScoreStepperProps) {
  return (
    <div className="score-stepper card">
      <div className="score-stepper__info">
        <span className="score-stepper__name">{playerName}</span>
        <span className="score-stepper__net-par">Net par {netPar}</span>
      </div>
      <div className="score-stepper__controls">
        <button
          type="button"
          className="button button--secondary score-stepper__button"
          aria-label={`Decrease ${playerName}'s score`}
          onClick={() => onChange(-1)}
        >
          −
        </button>
        <span className="score-stepper__score">{score ?? '-'}</span>
        <button
          type="button"
          className="button button--primary score-stepper__button"
          aria-label={`Increase ${playerName}'s score`}
          onClick={() => onChange(1)}
        >
          +
        </button>
      </div>
    </div>
  )
}
