import { Fragment, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useActiveRound } from '../context/ActiveRoundContext'
import { fetchCompletedRound } from '../lib/history'
import { computeBlocks, netParForHole, diffForHole, type ScoreBlock } from '../lib/scoring'
import { diffClassName, diffText } from '../lib/diffDisplay'
import { formatDate } from '../lib/format'
import { WEATHER_ICONS, WEATHER_LABELS } from '../lib/weather'
import type { Round, WeatherTag } from '../lib/types'
import RatingPrompt from '../components/RatingPrompt'
import './Scorecard.css'

function DiffCell({ diff, className = '' }: { diff: ScoreBlock['perPlayer'][string]['diff']; className?: string }) {
  return <span className={`${diffClassName(diff)} ${className}`.trim()}>{diffText(diff)}</span>
}

function RoundSummaryCard({ round }: { round: Round }) {
  return (
    <div className="scorecard__summary card">
      <div className="scorecard__summary-row">
        <span className="scorecard__summary-label">Date</span>
        <span>{formatDate(round.startedAt)}</span>
      </div>
      {round.rating !== null && (
        <div className="scorecard__summary-row">
          <span className="scorecard__summary-label">Rating</span>
          <span className="scorecard__summary-stars">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} className={n <= round.rating! ? 'scorecard__star--active' : 'scorecard__star'}>
                ★
              </span>
            ))}
          </span>
        </div>
      )}
      {round.weather.length > 0 && (
        <div className="scorecard__summary-row">
          <span className="scorecard__summary-label">Weather</span>
          <span className="scorecard__summary-weather">
            {round.weather.map((tag: WeatherTag) => (
              <span key={tag} title={WEATHER_LABELS[tag]}>
                {WEATHER_ICONS[tag]}
              </span>
            ))}
          </span>
        </div>
      )}
      {round.notes && (
        <div className="scorecard__summary-row scorecard__summary-row--notes">
          <span className="scorecard__summary-label">Notes</span>
          <p className="scorecard__summary-notes">{round.notes}</p>
        </div>
      )}
    </div>
  )
}

export default function Scorecard() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { round: activeRound, endRound } = useActiveRound()
  const [readOnlyRound, setReadOnlyRound] = useState<Round | null>(null)
  const [showRating, setShowRating] = useState(false)

  const isLive = !!activeRound && activeRound.id === id
  const round = isLive ? activeRound : readOnlyRound

  useEffect(() => {
    if (isLive || !id) return
    fetchCompletedRound(id).then(setReadOnlyRound)
  }, [isLive, id])

  if (!round) {
    return (
      <div className="screen">
        <p>Loading scorecard…</p>
      </div>
    )
  }

  const { subtotals, total } = computeBlocks(round)
  const holes = [...round.holes].sort((a, b) => a.number - b.number)

  async function handleEndRound(rating: number, notes: string, weather: WeatherTag[]) {
    await endRound(rating, notes, weather)
    setShowRating(false)
    navigate('/')
  }

  return (
    <div className="screen scorecard">
      <div className="scorecard__header">
        <h1>{round.courseName}</h1>
        <div className="scorecard__header-actions">
          {isLive && (
            <>
              <button type="button" className="button button--secondary" onClick={() => navigate(`/round/${id}/setup`)}>
                Course setup
              </button>
              <button
                type="button"
                className="button button--secondary"
                onClick={() => navigate(`/round/${id}/hole/${holes.at(-1)?.number ?? 1}`)}
              >
                Back to hole entry
              </button>
            </>
          )}
        </div>
      </div>

      {isLive && (
        <button type="button" className="button button--primary button--block" onClick={() => setShowRating(true)}>
          End round
        </button>
      )}

      {!isLive && <RoundSummaryCard round={round} />}

      <div className="scorecard__table-wrap">
        <table className="scorecard__table">
          <thead>
            <tr>
              <th>Hole</th>
              <th>Par</th>
              <th>SI</th>
              {round.players.map((p) => (
                <th key={p.id}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holes.map((h) => {
              const subtotal = h.number % 9 === 0 ? subtotals.find((b) => b.toHole === h.number) : undefined
              return (
                <Fragment key={h.number}>
                  <tr>
                    <td>
                      {isLive ? (
                        <button
                          type="button"
                          className="scorecard__hole-link"
                          onClick={() => navigate(`/round/${id}/hole/${h.number}`)}
                        >
                          {h.number}
                        </button>
                      ) : (
                        h.number
                      )}
                    </td>
                    <td>{h.par}</td>
                    <td>{h.strokeIndex}</td>
                    {round.players.map((p) => {
                      const diff = diffForHole(round, h.number, p.id)
                      return (
                        <td key={p.id} className="scorecard__score-cell">
                          <span className="scorecard__score-line">
                            <span className="scorecard__gross">{h.scores[p.id] ?? '-'}</span>
                            {diff !== null && <DiffCell diff={diff} className="scorecard__hole-diff" />}
                          </span>
                          <span className="scorecard__net">net {netParForHole(round, h.number, p.id)}</span>
                        </td>
                      )
                    })}
                  </tr>
                  {subtotal && (
                    <tr key={`subtotal-${subtotal.label}`} className="scorecard__block-row">
                      <td colSpan={2}>{subtotal.label}</td>
                      <td>Par {subtotal.parTotal}</td>
                      {round.players.map((p) => (
                        <td key={p.id} className="scorecard__score-cell">
                          <span className="scorecard__gross">
                            {subtotal.perPlayer[p.id].holesPlayed > 0 ? subtotal.perPlayer[p.id].gross : '-'}
                          </span>
                          <span className="scorecard__net">
                            <DiffCell diff={subtotal.perPlayer[p.id].diff} />
                          </span>
                        </td>
                      ))}
                    </tr>
                  )}
                </Fragment>
              )
            })}

            {total && (
              <tr className="scorecard__block-row scorecard__block-row--grand">
                <td colSpan={2}>{total.label}</td>
                <td>Par {total.parTotal}</td>
                {round.players.map((p) => (
                  <td key={p.id} className="scorecard__score-cell">
                    <span className="scorecard__gross">
                      {total.perPlayer[p.id].holesPlayed > 0 ? total.perPlayer[p.id].gross : '-'}
                    </span>
                    <span className="scorecard__net">
                      <DiffCell diff={total.perPlayer[p.id].diff} />
                    </span>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showRating && <RatingPrompt onSubmit={handleEndRound} />}
    </div>
  )
}
