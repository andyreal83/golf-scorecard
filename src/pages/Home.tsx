import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveRound } from '../context/ActiveRoundContext'
import { fetchHistory, removeFromHistory } from '../lib/history'
import type { RoundSummary } from '../lib/types'
import { diffClassName, diffText } from '../lib/diffDisplay'
import { formatDate } from '../lib/format'
import ConfirmDialog from '../components/ConfirmDialog'
import './Home.css'

export default function Home() {
  const navigate = useNavigate()
  const { round, loading } = useActiveRound()
  const [history, setHistory] = useState<RoundSummary[]>([])
  const [pendingDelete, setPendingDelete] = useState<RoundSummary | null>(null)

  useEffect(() => {
    fetchHistory().then(setHistory)
  }, [])

  async function confirmDelete() {
    if (!pendingDelete) return
    await removeFromHistory(pendingDelete.id)
    setHistory((h) => h.filter((r) => r.id !== pendingDelete.id))
    setPendingDelete(null)
  }

  return (
    <div className="screen">
      <div className="home__header">
        <h1 className="home__title">Golf Scorecard</h1>
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
              onClick={() => navigate(`/round/${round.id}/hole/${round.holes.at(-1)?.number ?? 1}`)}
            >
              Resume round
            </button>
          )}
          <button
            type="button"
            className={`button button--block ${round ? 'button--secondary' : 'button--primary'}`}
            onClick={() => navigate('/round/new')}
          >
            Start round
          </button>
        </div>
      )}

      <h2 className="home__section-title">Past rounds</h2>
      {history.length === 0 && <p className="home__empty">No completed rounds yet.</p>}
      <ul className="home__list">
        {history.map((r) => (
          <li key={r.id} className="home__item card">
            <button type="button" className="home__item-main" onClick={() => navigate(`/round/${r.id}/scorecard`)}>
              <span className="home__item-info">
                <span className="home__item-course">{r.courseName}</span>
                <span className="home__item-date">{formatDate(r.startedAt)}</span>
              </span>
              <span className="home__item-score">
                <span className="home__item-gross">{r.player1Score ?? '—'}</span>
                <span className={diffClassName(r.player1Diff)}>{diffText(r.player1Diff)}</span>
              </span>
            </button>
            <button
              type="button"
              className="home__item-delete"
              aria-label={`Delete round at ${r.courseName}`}
              onClick={() => setPendingDelete(r)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this round?"
          body={`${pendingDelete.courseName} — ${formatDate(pendingDelete.startedAt)}. This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
