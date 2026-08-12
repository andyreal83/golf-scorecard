import type { Round } from '../../src/lib/types'
import { computeBlocks } from '../../src/lib/scoring'

export interface RoundRow {
  id: string
  status: string
  course_name: string
  format: number
  started_at: string
  ended_at: string | null
  rating: number | null
  player1_name: string
  player1_score: number | null
  player1_diff: string | null
  player1_points: number | null
  weather: Round['weather'] | null
  data: { players: Round['players']; holes: Round['holes']; notes?: string; weather?: Round['weather'] }
  updated_at: string
}

export function rowToRound(row: RoundRow): Round {
  return {
    id: row.id,
    status: row.status as Round['status'],
    courseName: row.course_name,
    format: row.format as Round['format'],
    startedAt: row.started_at,
    endedAt: row.ended_at,
    rating: row.rating,
    notes: row.data.notes ?? '',
    weather: row.data.weather ?? [],
    players: row.data.players,
    holes: row.data.holes,
    updatedAt: row.updated_at,
  }
}

function player1GrossTotal(round: Round): number | null {
  const player1 = round.players[0]
  if (!player1) return null
  const scores = round.holes.map((h) => h.scores[player1.id]).filter((s): s is number => typeof s === 'number')
  return scores.length ? scores.reduce((sum, s) => sum + s, 0) : null
}

function player1Diff(round: Round): string | null {
  const player1 = round.players[0]
  if (!player1) return null
  return computeBlocks(round).total?.perPlayer[player1.id]?.diff ?? null
}

function player1Points(round: Round): number | null {
  const player1 = round.players[0]
  if (!player1) return null
  const total = computeBlocks(round).total?.perPlayer[player1.id]
  return total && total.holesPlayed > 0 ? total.points : null
}

export function roundToRow(round: Round): RoundRow {
  return {
    id: round.id,
    status: round.status,
    course_name: round.courseName,
    format: round.format,
    started_at: round.startedAt,
    ended_at: round.endedAt,
    rating: round.rating,
    player1_name: round.players[0]?.name ?? '',
    player1_score: player1GrossTotal(round),
    player1_diff: player1Diff(round),
    player1_points: player1Points(round),
    weather: round.weather,
    data: { players: round.players, holes: round.holes, notes: round.notes, weather: round.weather },
    updated_at: round.updatedAt,
  }
}
