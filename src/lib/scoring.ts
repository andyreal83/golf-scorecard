import { playingHandicap, strokesReceived, netPar, formatDiff, stablefordPoints, type DiffLabel } from './handicap'
import type { Hole, Round } from './types'

export interface ScoreBlock {
  label: string
  fromHole: number
  toHole: number
  parTotal: number
  perPlayer: Record<
    string,
    { netParTotal: number; gross: number; holesPlayed: number; points: number; diff: DiffLabel | null }
  >
}

/**
 * A course's printed stroke index is always out of 18 (it's fixed to the
 * full course), but the holes actually being played might be any subset of
 * that range — e.g. a back nine could be SI 2,4,6,8,10,12,14,16,18. Rank
 * those holes by relative difficulty (lowest printed SI = hardest = rank 1)
 * so strokesReceived can allocate strokes by cycling through the round's
 * own hole count, not the printed 1-18 values directly.
 */
function rankHolesByDifficulty(holes: Hole[]): Map<number, number> {
  const ranked = [...holes].sort((a, b) => a.strokeIndex - b.strokeIndex || a.number - b.number)
  const ranks = new Map<number, number>()
  ranked.forEach((h, i) => ranks.set(h.number, i + 1))
  return ranks
}

function strokesForHole(round: Round, holeNumber: number, playingHcp: number): number {
  // An 18-hole round always uses the printed stroke index directly against
  // the (unhalved) playing handicap — no ranking needed, since the whole
  // course's 1-18 range is exactly what's being played, even if the round
  // later ends early. Ranking is only needed for a 9-hole round, where the
  // holes played are some subset of the full 1-18 range. The cycle length
  // is fixed at the round's format (9), not however many holes have been
  // entered so far — using the hole count instead would badly over-allocate
  // strokes to whichever single hole happens to exist first.
  if (round.format === 18) {
    const hole = round.holes.find((h) => h.number === holeNumber)
    if (!hole) return 0
    return strokesReceived(hole.strokeIndex, playingHcp, 18)
  }
  const rank = rankHolesByDifficulty(round.holes).get(holeNumber)
  if (rank === undefined) return 0
  return strokesReceived(rank, playingHcp, round.format)
}

function buildBlock(round: Round, from: number, to: number, label: string): ScoreBlock {
  const slice = round.holes.filter((h) => h.number >= from && h.number <= to)
  const parTotal = slice.reduce((sum, h) => sum + h.par, 0)
  const perPlayer: ScoreBlock['perPlayer'] = {}
  for (const p of round.players) {
    const hcp = playingHandicap(p.handicap, round.format)
    let netParTotal = 0
    let gross = 0
    let holesPlayed = 0
    let points = 0
    for (const h of slice) {
      const score = h.scores[p.id]
      if (score === undefined) continue
      const holeNetPar = netPar(h.par, strokesForHole(round, h.number, hcp))
      netParTotal += holeNetPar
      gross += score
      points += stablefordPoints(score, holeNetPar)
      holesPlayed++
    }
    perPlayer[p.id] = {
      netParTotal,
      gross,
      holesPlayed,
      points,
      diff: holesPlayed > 0 ? formatDiff(gross, netParTotal) : null,
    }
  }
  return { label, fromHole: from, toHole: to, parTotal, perPlayer }
}

/**
 * Subtotal after every *completed* 9-hole block, plus a running total for
 * every hole played so far — shown live as the round progresses, not just
 * once it ends, so the total line under the 9-hole blocks always reflects
 * where things stand. Holes without a recorded score for a player don't
 * contribute to that player's gross/net-par totals (see diffForHole below).
 * There are only ever two possible blocks — the front nine ("Out") and the
 * back nine ("In"), standard golf terminology.
 */
export function computeBlocks(round: Round): { subtotals: ScoreBlock[]; total: ScoreBlock | null } {
  const holeCount = round.holes.length
  const fullNines = Math.floor(holeCount / 9)
  const subtotals: ScoreBlock[] = []
  for (let k = 1; k <= fullNines; k++) {
    const from = 9 * (k - 1) + 1
    const to = 9 * k
    subtotals.push(buildBlock(round, from, to, k === 1 ? 'Out' : 'In'))
  }
  const total = holeCount > 0 ? buildBlock(round, 1, holeCount, 'Total') : null
  return { subtotals, total }
}

export function netParForHole(round: Round, holeNumber: number, playerId: string): number {
  const hole = round.holes.find((h) => h.number === holeNumber)
  const player = round.players.find((p) => p.id === playerId)
  if (!hole || !player) return 0
  const hcp = playingHandicap(player.handicap, round.format)
  return netPar(hole.par, strokesForHole(round, holeNumber, hcp))
}

/** This hole's gross score vs its net par — null if the player hasn't recorded a score yet. */
export function diffForHole(round: Round, holeNumber: number, playerId: string): DiffLabel | null {
  const hole = round.holes.find((h) => h.number === holeNumber)
  if (!hole) return null
  const score = hole.scores[playerId]
  if (score === undefined) return null
  return formatDiff(score, netParForHole(round, holeNumber, playerId))
}

/** Cumulative gross vs cumulative net par through (and including) a given hole, over holes actually scored so far. */
export function cumulativeDiffThroughHole(round: Round, holeNumber: number, playerId: string): DiffLabel | null {
  return buildBlock(round, 1, holeNumber, 'through').perPlayer[playerId]?.diff ?? null
}

/** Cumulative Stableford points through (and including) a given hole, over holes actually scored so far. */
export function cumulativePointsThroughHole(round: Round, holeNumber: number, playerId: string): number {
  return buildBlock(round, 1, holeNumber, 'through').perPlayer[playerId]?.points ?? 0
}

/**
 * The first hole (in order) that isn't yet fully scored for every player —
 * used to resume a round exactly where it was left off, rather than always
 * jumping to whichever hole happens to have been created last.
 */
export function firstIncompleteHoleNumber(round: Round): number {
  const holes = [...round.holes].sort((a, b) => a.number - b.number)
  for (const h of holes) {
    const allScored = round.players.every((p) => h.scores[p.id] !== undefined)
    if (!allScored) return h.number
  }
  return Math.min(holes.length + 1, round.format)
}
