import type { DiffLabel } from '../lib/handicap'
import { diffClassName, diffText } from '../lib/diffDisplay'
import './ScoreStepper.css'

interface ScoreStepperProps {
  playerName: string
  netPar: number
  score: number | undefined
  /** This hole's gross vs net par — null until a score is recorded. */
  diff: DiffLabel | null
  onChange: (delta: number) => void
}

// Keeps the card's layout stable regardless of name length.
function trimName(name: string): string {
  return name.slice(0, 4)
}

export default function ScoreStepper({ playerName, netPar, score, diff, onChange }: ScoreStepperProps) {
  return (
    <div className="score-stepper card">
      <div className="score-stepper__info">
        <span className="score-stepper__name">{trimName(playerName)}</span>
        <span className="score-stepper__net-par">Par {netPar}</span>
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
        <div className="score-stepper__score-wrap">
          <span className="score-stepper__score">{score ?? '-'}</span>
          {diff !== null && <span className={`score-stepper__diff ${diffClassName(diff)}`}>{diffText(diff)}</span>}
        </div>
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
