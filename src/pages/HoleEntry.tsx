import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveRound } from '../context/ActiveRoundContext'
import { cumulativeDiffThroughHole, cumulativePointsThroughHole, diffForHole, netParForHole } from '../lib/scoring'
import PillSelector from '../components/PillSelector'
import ScoreStepper from '../components/ScoreStepper'
import ScoreSummary from '../components/ScoreSummary'
import GolfBallIcon from '../components/GolfBallIcon'
import CourseMapModal from '../components/CourseMapModal'
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
  const [showMap, setShowMap] = useState(false)

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
          Back Home
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

  // A hole's own map takes priority; otherwise fall back to the round's overall map.
  const mapImage = hole.mapImage ?? round.mapImage

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
        <div className="hole-entry__title-block">
          <h1 className="hole-entry__title" aria-label={`Hole ${holeNumber}`}>
            <span aria-hidden="true">⛳</span> {holeNumber}
          </h1>
          {!!hole.yards && (
            <span className="hole-entry__yards">
              <GolfBallIcon /> {hole.yards} yds
            </span>
          )}
        </div>
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
        <PillSelector label="SI" value={hole.strokeIndex} options={SI_OPTIONS} onChange={(v) => setStrokeIndex(holeNumber, v)} />
      </div>

      <div className="hole-entry__players">
        {round.players.map((p) => (
          <ScoreStepper
            key={p.id}
            playerName={p.name}
            netPar={netParForHole(round, holeNumber, p.id)}
            score={hole.scores[p.id]}
            diff={diffForHole(round, holeNumber, p.id)}
            onChange={(delta) => adjustScore(holeNumber, p.id, delta)}
          />
        ))}
      </div>

      <ScoreSummary
        rows={round.players.map((p) => ({
          playerId: p.id,
          name: p.name,
          diff: cumulativeDiffThroughHole(round, holeNumber, p.id),
          points: cumulativePointsThroughHole(round, holeNumber, p.id),
        }))}
      />

      <div className="hole-entry__footer">
        <div className="hole-entry__footer-row">
          <button type="button" className="button button--secondary" onClick={() => navigate(`/round/${id}/scorecard`)}>
            Scorecard
          </button>
          {!!mapImage && (
            <button type="button" className="button button--secondary" onClick={() => setShowMap(true)}>
              Course Map
            </button>
          )}
        </div>
      </div>

      {showMap && mapImage && <CourseMapModal src={mapImage} onClose={() => setShowMap(false)} />}
    </div>
  )
}
