import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { CourseHole, Hole, Player, Round, RoundFormat as Format, WeatherTag } from '../lib/types'
import * as db from '../lib/db'
import { reconcile, scheduleSync, flushSync } from '../lib/sync'
import { upsertHistorySummary } from '../lib/history'
import { makeId } from '../lib/id'

const DEFAULT_PAR = 4
const DEFAULT_SI = 1

function nowIso() {
  return new Date().toISOString()
}

function makeHole(number: number): Hole {
  return { number, par: DEFAULT_PAR, strokeIndex: DEFAULT_SI, scores: {} }
}

interface ActiveRoundContextValue {
  round: Round | null
  loading: boolean
  startRound: (
    courseName: string,
    format: Format,
    players: Player[],
    courseHoles?: CourseHole[],
    mapImage?: string,
  ) => Promise<Round>
  ensureHole: (holeNumber: number) => void
  setPar: (holeNumber: number, par: number) => void
  setStrokeIndex: (holeNumber: number, si: number) => void
  setYards: (holeNumber: number, yards: number | undefined) => void
  adjustScore: (holeNumber: number, playerId: string, delta: number) => void
  endRound: (rating: number, notes: string, weather: WeatherTag[]) => Promise<void>
  discardActiveRound: () => Promise<void>
}

const ActiveRoundContext = createContext<ActiveRoundContextValue | null>(null)

export function ActiveRoundProvider({ children }: { children: ReactNode }) {
  const [round, setRound] = useState<Round | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const local = await db.getActiveRound()
      if (!cancelled) {
        setRound(local)
        setLoading(false)
      }
      if (local) {
        const winner = await reconcile(local)
        if (cancelled) return
        if (winner !== local) {
          await db.saveActiveRound(winner)
          setRound(winner)
        } else {
          scheduleSync(local)
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  function persist(next: Round) {
    setRound(next)
    void db.saveActiveRound(next)
    scheduleSync(next)
  }

  async function startRound(
    courseName: string,
    format: Format,
    players: Player[],
    courseHoles?: CourseHole[],
    mapImage?: string,
  ) {
    const holes: Hole[] =
      courseHoles && courseHoles.length > 0
        ? courseHoles.map((h) => ({
            number: h.number,
            par: h.par,
            strokeIndex: h.strokeIndex,
            yards: h.yards,
            mapImage: h.mapImage,
            scores: {},
          }))
        : [makeHole(1)]
    const round: Round = {
      id: makeId(),
      status: 'in_progress',
      courseName,
      format,
      startedAt: nowIso(),
      endedAt: null,
      rating: null,
      notes: '',
      weather: [],
      players,
      holes,
      mapImage,
      updatedAt: nowIso(),
    }
    persist(round)
    return round
  }

  function updateRound(mutate: (r: Round) => Round) {
    setRound((current) => {
      if (!current) return current
      const next = { ...mutate(current), updatedAt: nowIso() }
      void db.saveActiveRound(next)
      scheduleSync(next)
      return next
    })
  }

  function ensureHole(holeNumber: number) {
    updateRound((r) => {
      if (r.holes.some((h) => h.number === holeNumber)) return r
      return { ...r, holes: [...r.holes, makeHole(holeNumber)].sort((a, b) => a.number - b.number) }
    })
  }

  function setPar(holeNumber: number, par: number) {
    updateRound((r) => ({
      ...r,
      holes: r.holes.map((h) => (h.number === holeNumber ? { ...h, par } : h)),
    }))
  }

  function setStrokeIndex(holeNumber: number, strokeIndex: number) {
    updateRound((r) => ({
      ...r,
      holes: r.holes.map((h) => (h.number === holeNumber ? { ...h, strokeIndex } : h)),
    }))
  }

  function setYards(holeNumber: number, yards: number | undefined) {
    updateRound((r) => ({
      ...r,
      holes: r.holes.map((h) => (h.number === holeNumber ? { ...h, yards } : h)),
    }))
  }

  function adjustScore(holeNumber: number, playerId: string, delta: number) {
    updateRound((r) => ({
      ...r,
      holes: r.holes.map((h) => {
        if (h.number !== holeNumber) return h
        const current = h.scores[playerId]
        const next = current === undefined ? 1 : Math.max(1, current + delta)
        return { ...h, scores: { ...h.scores, [playerId]: next } }
      }),
    }))
  }

  async function endRound(rating: number, notes: string, weather: WeatherTag[]) {
    if (!round) return
    const completed: Round = {
      ...round,
      status: 'completed',
      endedAt: nowIso(),
      rating,
      notes,
      weather,
      updatedAt: nowIso(),
    }
    await db.saveActiveRound(completed)
    flushSync(completed)
    await upsertHistorySummary(completed)
    await db.clearActiveRound()
    setRound(null)
  }

  async function discardActiveRound() {
    await db.clearActiveRound()
    setRound(null)
  }

  const value = useMemo<ActiveRoundContextValue>(
    () => ({
      round,
      loading,
      startRound,
      ensureHole,
      setPar,
      setStrokeIndex,
      setYards,
      adjustScore,
      endRound,
      discardActiveRound,
    }),
    [round, loading],
  )

  return <ActiveRoundContext.Provider value={value}>{children}</ActiveRoundContext.Provider>
}

export function useActiveRound() {
  const ctx = useContext(ActiveRoundContext)
  if (!ctx) throw new Error('useActiveRound must be used within ActiveRoundProvider')
  return ctx
}
