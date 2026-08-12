import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveRound } from '../context/ActiveRoundContext'
import { fetchHistory } from '../lib/history'
import { firstIncompleteHoleNumber } from '../lib/scoring'
import type { RoundSummary } from '../lib/types'
import { diffClassName, diffText } from '../lib/diffDisplay'
import { formatDate } from '../lib/format'
import { WEATHER_ICONS, WEATHER_LABELS } from '../lib/weather'
import StarRating from '../components/StarRating'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const { round, loading } = useActiveRound()
  const [history, setHistory] = useState<RoundSummary[]>([])

  useEffect(() => {
    fetchHistory().then(setHistory)
  }, [])

  return (
    <div className="screen">
      <div className="home__header">
        <h1 className="home__title">Gimmie</h1>
        <button type="button" className="button button--secondary" onClick={() => navigate('/settings')}>
          Settings
        </button>
      </div>

      {!loading && (
        <div className="home__actions">
          {round && (
            <button
              type="button"
              className="button button--primary button--block"
              onClick={() => navigate(`/round/${round.id}/hole/${firstIncompleteHoleNumber(round)}`)}
            >
              Resume Round
            </button>
          )}
          <button
            type="button"
            className={`button button--block ${round ? 'button--secondary' : 'button--primary'}`}
            onClick={() => navigate('/round/new')}
          >
            Start Round
          </button>
        </div>
      )}

      <h2 className="home__section-title">Past Rounds</h2>
      {history.length === 0 && <p className="home__empty">No completed rounds yet.</p>}
      <ul className="home__list">
        {history.map((r) => (
          <li key={r.id} className="home__item card">
            <button type="button" className="home__item-main" onClick={() => navigate(`/round/${r.id}/scorecard`)}>
              <span className="home__item-info">
                <span className="home__item-course">{r.courseName}</span>
                <span className="home__item-meta">
                  <span aria-hidden="true">⛳</span> {r.format} | {formatDate(r.startedAt)}
                </span>
              </span>
              <span className="home__item-score">
                <span className="home__item-score-row">
                  <span className="home__item-gross">{r.player1Score ?? '—'}</span>
                  <span className={diffClassName(r.player1Diff)}>{diffText(r.player1Diff)}</span>
                  {r.player1Points !== null && <span className="home__item-points">{r.player1Points} pts</span>}
                </span>
                <span className="home__item-extras">
                  {r.weather.map((tag) => (
                    <span key={tag} title={WEATHER_LABELS[tag]}>
                      {WEATHER_ICONS[tag]}
                    </span>
                  ))}
                  {r.rating !== null && <StarRating rating={r.rating} className="home__item-stars" />}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
