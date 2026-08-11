import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveRound } from '../context/ActiveRoundContext'
import { cumulativeDiffThroughHole, netParForHole } from '../lib/scoring'
import { diffClassName, diffText } from '../lib/diffDisplay'
import PillSelector from '../components/PillSelector'
import ScoreStepper from '../components/ScoreStepper'
import { useSwipe } from '../lib/useSwipe'
import './HoleEntry.css'

const PAR_OPTIONS = [3, 4, 5]
// Stroke index is a property of the full 18-hole course, always 1-18 even
// when playing only 9 holes of it.
const SI_OPTIONS = Array.from({ length: 18 }, (_, i) => i + 1)

export default function HoleEntry() {
  const { id, n } = useParams()
  const holeNumber = Number(n)
  const navigate = useNavigate()
  const { round, ensureHole, setPar, setStrokeIndex, adjustScore } = useActiveRound()

  useEffect(() => {
    if (round && !round.holes.some((h) => h.number === holeNumber)) {
      ensureHole(holeNumber)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.id, holeNumber])

  const canGoForward = !!round && holeNumber < round.format

  const swipeHandlers = useSwipe(
    () => canGoForward && navigate(`/round/${id}/hole/${holeNumber + 1}`),
    () => holeNumber > 1 && navigate(`/round/${id}/hole/${holeNumber - 1}`),
  )

  if (!round || round.id !== id) {
    return (
      <div className="screen">
        <p>No active round.</p>
        <button type="button" className="button button--primary" onClick={() => navigate('/')}>
          Back home
        </button>
      </div>
    )
  }

  const hole = round.holes.find((h) => h.number === holeNumber)
  if (!hole) {
    return (
      <div className="screen">
        <p>Loading hole…</p>
      </div>
    )
  }

  return (
    <div className="screen hole-entry" {...swipeHandlers}>
      <div className="hole-entry__header">
        <button
          type="button"
          className="button button--secondary hole-entry__nav"
          aria-label="Previous hole"
          disabled={holeNumber <= 1}
          onClick={() => navigate(`/round/${id}/hole/${holeNumber - 1}`)}
        >
          ◀
        </button>
        <h1 className="hole-entry__title">Hole {holeNumber}</h1>
        <button
          type="button"
          className="button button--secondary hole-entry__nav"
          aria-label="Next hole"
          disabled={!canGoForward}
          onClick={() => canGoForward && navigate(`/round/${id}/hole/${holeNumber + 1}`)}
        >
          ▶
        </button>
      </div>

      <div className="hole-entry__selectors">
        <PillSelector label="Par" value={hole.par} options={PAR_OPTIONS} onChange={(v) => setPar(holeNumber, v)} />
        <PillSelector
          label="Stroke index"
          value={hole.strokeIndex}
          options={SI_OPTIONS}
          onChange={(v) => setStrokeIndex(holeNumber, v)}
        />
      </div>

      <div className="hole-entry__players">
        {round.players.map((p) => (
          <ScoreStepper
            key={p.id}
            playerName={p.name}
            netPar={netParForHole(round, holeNumber, p.id)}
            score={hole.scores[p.id]}
            onChange={(delta) => adjustScore(holeNumber, p.id, delta)}
          />
        ))}
      </div>

      <div className="hole-entry__totals card">
        {round.players.map((p) => {
          const diff = cumulativeDiffThroughHole(round, holeNumber, p.id)
          return (
            <div key={p.id} className="hole-entry__totals-row">
              <span className="hole-entry__totals-name">{p.name}</span>
              <span className={diffClassName(diff)}>{diffText(diff)}</span>
            </div>
          )
        })}
      </div>

      <div className="hole-entry__footer">
        <button type="button" className="button button--secondary button--block" onClick={() => navigate(`/round/${id}/scorecard`)}>
          Scorecard
        </button>
      </div>
    </div>
  )
}
