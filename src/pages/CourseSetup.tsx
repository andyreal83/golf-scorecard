import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveRound } from '../context/ActiveRoundContext'
import PillSelector from '../components/PillSelector'
import './CourseSetup.css'

const PAR_OPTIONS = [3, 4, 5]
// Stroke index is a property of the full 18-hole course, always 1-18 even
// when playing only 9 holes of it.
const SI_OPTIONS = Array.from({ length: 18 }, (_, i) => i + 1)

export default function CourseSetup() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { round, ensureHole, setPar, setStrokeIndex, setYards } = useActiveRound()

  useEffect(() => {
    if (!round) return
    for (let n = 1; n <= round.format; n++) {
      if (!round.holes.some((h) => h.number === n)) ensureHole(n)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round?.id, round?.format, round?.holes.length])

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

  const holes = [...round.holes].sort((a, b) => a.number - b.number)

  return (
    <div className="screen course-setup">
      <div className="course-setup__header">
        <h1>Course Setup</h1>
        <button type="button" className="button button--secondary" onClick={() => navigate(`/round/${id}/scorecard`)}>
          Done
        </button>
      </div>
      <p className="course-setup__hint">Set par and stroke index for every hole before you start playing.</p>

      <div className="course-setup__list">
        {holes.map((h) => (
          <div key={h.number} className="course-setup__row card">
            <span className="course-setup__hole-number">{h.number}</span>
            <PillSelector small label="Par" value={h.par} options={PAR_OPTIONS} onChange={(v) => setPar(h.number, v)} />
            <PillSelector
              small
              label="SI"
              value={h.strokeIndex}
              options={SI_OPTIONS}
              onChange={(v) => setStrokeIndex(h.number, v)}
            />
            <label className="course-setup__yards">
              <span className="course-setup__yards-label">Yds</span>
              <input
                type="number"
                inputMode="numeric"
                className="course-setup__yards-input"
                value={h.yards ?? ''}
                onChange={(e) => setYards(h.number, e.target.value ? Number(e.target.value) : undefined)}
              />
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}
