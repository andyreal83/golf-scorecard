import { describe, expect, it } from 'vitest'
import { computeBlocks, netParForHole } from './scoring'
import type { Hole, Round } from './types'

function makeRound(overrides: Partial<Round> & { holes: Hole[] }): Round {
  return {
    id: 'round-1',
    status: 'in_progress',
    courseName: 'Test Course',
    format: 18,
    startedAt: new Date(0).toISOString(),
    endedAt: null,
    rating: null,
    notes: '',
    weather: [],
    players: [{ id: 'p1', name: 'Player 1', handicap: 0 }],
    updatedAt: new Date(0).toISOString(),
    ...overrides,
  }
}

function parHole(number: number, strokeIndex: number, playerId: string, par = 4): Hole {
  return { number, par, strokeIndex, scores: { [playerId]: par } }
}

describe('9-hole stroke allocation (regression: handicap 34 over 9 holes)', () => {
  it('spreads all 17 strokes across the 9 holes played, not just the ones with a low printed SI', () => {
    // A real back-nine's printed stroke index is scattered across the full
    // 1-18 course range, e.g. all even numbers — not conveniently 1-9.
    const backNineSI = [2, 4, 6, 8, 10, 12, 14, 16, 18]
    const holes = backNineSI.map((si, i) => parHole(i + 1, si, 'p1'))
    const round = makeRound({
      format: 9,
      players: [{ id: 'p1', name: 'Player 1', handicap: 34 }],
      holes,
    })

    // Playing handicap = ceil(34/2) = 17. Scoring exactly par on every hole
    // should be 17 shots under net par once all 17 strokes are allocated.
    const { total } = computeBlocks(round)
    expect(total?.perPlayer.p1.diff).toBe('-17')

    // The hardest hole (lowest SI = 2, rank 1) gets a 2nd stroke; the
    // easiest (SI 18, rank 9) gets only its 1st.
    expect(netParForHole(round, 1, 'p1')).toBe(6) // par 4 + 2 strokes
    expect(netParForHole(round, 9, 'p1')).toBe(5) // par 4 + 1 stroke
  })

  it('still gives exactly one stroke per hole when the 9-hole playing handicap is 9 or fewer', () => {
    const holes = [2, 4, 6, 8, 10, 12, 14, 16, 18].map((si, i) => parHole(i + 1, si, 'p1'))
    const round = makeRound({
      format: 9,
      players: [{ id: 'p1', name: 'Player 1', handicap: 16 }], // playing hcp = 8
      holes,
    })
    const { total } = computeBlocks(round)
    expect(total?.perPlayer.p1.diff).toBe('-8')
  })

  it('rounds a half handicap up (25 over 9 holes -> playing handicap 13)', () => {
    const holes = [2, 4, 6, 8, 10, 12, 14, 16, 18].map((si, i) => parHole(i + 1, si, 'p1'))
    const round = makeRound({
      format: 9,
      players: [{ id: 'p1', name: 'Player 1', handicap: 25 }], // playing hcp = ceil(12.5) = 13
      holes,
    })
    const { total } = computeBlocks(round)
    expect(total?.perPlayer.p1.diff).toBe('-13')
  })

  it('does not over-allocate strokes before all 9 holes have been entered yet', () => {
    // Regression: only the first hole has been created so far (the normal
    // hole-by-hole flow, not Course Setup). The cycle length must stay
    // fixed at the round's format (9), not shrink to the 1 hole known so
    // far, or a high handicap wraps around itself absurdly.
    const round = makeRound({
      format: 9,
      players: [{ id: 'p1', name: 'Player 1', handicap: 25 }], // playing hcp = 13
      holes: [parHole(1, 1, 'p1')],
    })
    // rank 1 of (at least) 9, cycle 9: 13 = 9 + 4, so rank 1 (<=4) gets 2 strokes, not 13
    expect(netParForHole(round, 1, 'p1')).toBe(6)
  })
})

describe('18-hole stroke allocation (unchanged)', () => {
  it('matches the printed stroke index directly when all 18 holes are unique 1-18', () => {
    const holes = Array.from({ length: 18 }, (_, i) => parHole(i + 1, i + 1, 'p1'))
    const round = makeRound({
      format: 18,
      players: [{ id: 'p1', name: 'Player 1', handicap: 14 }],
      holes,
    })
    const { total } = computeBlocks(round)
    expect(total?.perPlayer.p1.diff).toBe('-14')
  })

  it('uses the printed stroke index directly even before all 18 holes exist yet', () => {
    // Regression: an 18-hole round never ranks — it always compares the
    // printed stroke index straight against the (unhalved) playing
    // handicap, so this is stable from hole 1 onward regardless of how
    // many holes have been entered so far.
    const round = makeRound({
      format: 18,
      players: [{ id: 'p1', name: 'Player 1', handicap: 34 }],
      holes: [parHole(1, 15, 'p1')],
    })
    // SI 15 <= 34, and 34 wraps twice (34 - 18 - 18 < 0 after 2 passes... 34-18=16, 15<=16 -> 2nd stroke, 16-18<0 stop) = 2 strokes
    expect(netParForHole(round, 1, 'p1')).toBe(6)
  })
})
