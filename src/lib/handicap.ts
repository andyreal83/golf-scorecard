export type RoundFormat = 9 | 18

/**
 * Playing handicap = 18-hole handicap scaled to the round format, rounded up.
 */
export function playingHandicap(baseHandicap: number, format: RoundFormat): number {
  const scaled = format === 9 ? baseHandicap / 2 : baseHandicap
  return Math.ceil(scaled)
}

/**
 * Standard stroke allocation table method: one stroke for a hole ranked
 * `rank` (1 = hardest) among the `holesInRound` holes actually being
 * played, a further stroke each time the handicap "wraps around" that same
 * set again (handles a playing handicap bigger than the round — e.g. a
 * 9-hole playing handicap of 17 gives every hole a stroke, plus a second
 * stroke to the 8 hardest of those 9).
 *
 * Note `rank` here is the hole's *relative* difficulty position among the
 * holes in this round, not necessarily its printed course-wide stroke
 * index (1-18) — see scoring.ts, which is where that conversion happens.
 * A course's printed stroke index is always out of 18 (it's a property of
 * the full course), but when playing fewer holes than that, the raw 1-18
 * value can't be compared to the playing handicap directly, or a handicap
 * bigger than the round's own hole count could never receive its second
 * stroke on the holes actually played.
 */
export function strokesReceived(rank: number, playingHcp: number, holesInRound: number): number {
  if (playingHcp <= 0 || holesInRound <= 0) return 0
  let strokes = 0
  let remaining = playingHcp
  while (remaining > 0) {
    if (rank <= Math.min(remaining, holesInRound)) strokes += 1
    remaining -= holesInRound
  }
  return strokes
}

export function netPar(basePar: number, strokes: number): number {
  return basePar + strokes
}

export type DiffLabel = 'E' | `+${number}` | `-${number}`

/**
 * Format a gross-vs-net-par difference as golf shorthand: E / +n / -n.
 */
export function formatDiff(totalGross: number, totalNetPar: number): DiffLabel {
  const diff = totalGross - totalNetPar
  if (diff === 0) return 'E'
  return diff > 0 ? (`+${diff}` as const) : (`-${Math.abs(diff)}` as const)
}

/**
 * Stableford points for a single hole: 2 points for a net par, +1 for each
 * shot better, -1 for each shot worse, floored at 0 (never negative).
 */
export function stablefordPoints(gross: number, netPar: number): number {
  return Math.max(0, 2 - (gross - netPar))
}
