import type { DiffLabel } from '../lib/handicap'
import { diffClassName, diffText } from '../lib/diffDisplay'
import './ScoreSummary.css'

export interface ScoreSummaryRow {
  playerId: string
  name: string
  diff: DiffLabel | null
  points: number
}

/** Per-player name / running diff / Stableford points — used on Hole Entry
 * (scoped to the current hole) and on the Scorecard (scoped to the whole
 * round), so the same compact summary reads consistently everywhere. */
export default function ScoreSummary({ rows }: { rows: ScoreSummaryRow[] }) {
  return (
    <div className="score-summary card">
      {rows.map((r) => (
        <div key={r.playerId} className="score-summary__row">
          <span className="score-summary__name">{r.name}</span>
          <span className={diffClassName(r.diff)}>{diffText(r.diff)}</span>
          <span className="score-summary__points">{r.points} pts</span>
        </div>
      ))}
    </div>
  )
}
