import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActiveRound } from '../context/ActiveRoundContext'
import { fetchCourses } from '../lib/courses'
import { fetchSettings } from '../lib/settings'
import type { CourseHole, Player, RoundFormat, SavedCourse } from '../lib/types'
import { makeId } from '../lib/id'
import './StartRound.css'

interface DraftPlayer {
  id: string
  name: string
  handicap: string
}

function newDraftPlayer(): DraftPlayer {
  return { id: makeId(), name: '', handicap: '' }
}

export default function StartRound() {
  const navigate = useNavigate()
  const { startRound } = useActiveRound()
  const [courseName, setCourseName] = useState('')
  const [format, setFormat] = useState<RoundFormat>(18)
  const [players, setPlayers] = useState<DraftPlayer[]>([newDraftPlayer()])
  const [courses, setCourses] = useState<SavedCourse[]>([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [selectedCourseHoles, setSelectedCourseHoles] = useState<CourseHole[] | null>(null)
  const nameInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const focusNextId = useRef<string | null>(null)

  const canStart = courseName.trim().length > 0 && players.every((p) => p.name.trim().length > 0)

  useEffect(() => {
    fetchCourses().then(setCourses)
    fetchSettings().then((s) => {
      if (!s) return
      setPlayers((ps) => {
        if (ps.length !== 1 || ps[0].name || ps[0].handicap) return ps
        return [{ ...ps[0], name: s.name, handicap: s.handicap ? String(s.handicap) : '' }]
      })
    })
  }, [])

  useEffect(() => {
    if (focusNextId.current) {
      nameInputRefs.current[focusNextId.current]?.focus()
      focusNextId.current = null
    }
  }, [players])

  function updatePlayer(id: string, patch: Partial<DraftPlayer>) {
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  }

  function addPlayer() {
    setPlayers((ps) => {
      if (ps.length >= 4) return ps
      const player = newDraftPlayer()
      focusNextId.current = player.id
      return [...ps, player]
    })
  }

  function removePlayer(id: string) {
    setPlayers((ps) => (ps.length > 1 ? ps.filter((p) => p.id !== id) : ps))
  }

  function selectSavedCourse(courseId: string) {
    setSelectedCourseId(courseId)
    const course = courses.find((c) => c.id === courseId)
    if (course) {
      setCourseName(course.name)
      setFormat(course.format)
      setSelectedCourseHoles(course.holes)
    } else {
      setSelectedCourseHoles(null)
    }
  }

  function selectFormat(f: RoundFormat) {
    setFormat(f)
    setSelectedCourseId('')
    setSelectedCourseHoles(null)
  }

  async function handleStart() {
    if (!canStart) return
    const finalPlayers: Player[] = players.map((p) => ({
      id: p.id,
      name: p.name.trim(),
      handicap: Number(p.handicap) || 0,
    }))
    const round = await startRound(courseName.trim(), format, finalPlayers, selectedCourseHoles ?? undefined)
    navigate(`/round/${round.id}/hole/1`)
  }

  return (
    <div className="screen">
      <h1>Start a round</h1>

      {courses.length > 0 && (
        <label className="start-round__field">
          <span>Saved course</span>
          <select value={selectedCourseId} onChange={(e) => selectSavedCourse(e.target.value)}>
            <option value="">Type a course name below…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.format} holes)
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="start-round__field">
        <span>Course</span>
        <input
          type="text"
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="Course name"
        />
      </label>

      <div className="start-round__field">
        <span>Round format</span>
        <div className="start-round__format">
          {([9, 18] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`button ${format === f ? 'button--primary' : 'button--secondary'} button--block`}
              onClick={() => selectFormat(f)}
            >
              {f} holes
            </button>
          ))}
        </div>
      </div>

      <div className="start-round__players">
        <span className="start-round__players-label">Players</span>
        {players.map((p, i) => (
          <div key={p.id} className="start-round__player card">
            <div className="start-round__player-fields">
              <input
                type="text"
                ref={(el) => {
                  nameInputRefs.current[p.id] = el
                }}
                value={p.name}
                onChange={(e) => updatePlayer(p.id, { name: e.target.value })}
                placeholder={i === 0 ? 'Player 1 (you)' : `Player ${i + 1}`}
              />
              <input
                type="number"
                inputMode="decimal"
                value={p.handicap}
                onChange={(e) => updatePlayer(p.id, { handicap: e.target.value })}
                placeholder="Handicap"
              />
            </div>
            {players.length > 1 && (
              <button
                type="button"
                className="start-round__remove"
                aria-label={`Remove player ${i + 1}`}
                onClick={() => removePlayer(p.id)}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        {players.length < 4 && (
          <button type="button" className="button button--secondary button--block" onClick={addPlayer}>
            Add player
          </button>
        )}
      </div>

      <button type="button" className="button button--primary button--block" disabled={!canStart} onClick={handleStart}>
        Start round
      </button>
      <button type="button" className="button button--secondary button--block" onClick={() => navigate('/')}>
        Cancel
      </button>
    </div>
  )
}
