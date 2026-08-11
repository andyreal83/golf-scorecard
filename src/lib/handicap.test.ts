import { describe, expect, it } from 'vitest'
import { playingHandicap, strokesReceived, netPar, formatDiff } from './handicap'

describe('playingHandicap', () => {
  it('is unchanged for an 18-hole round', () => {
    expect(playingHandicap(14, 18)).toBe(14)
  })

  it('halves and rounds up for a 9-hole round', () => {
    expect(playingHandicap(15, 9)).toBe(8) // 7.5 -> 8
    expect(playingHandicap(14, 9)).toBe(7)
    expect(playingHandicap(1, 9)).toBe(1) // 0.5 -> 1
  })
})

// strokesReceived takes a hole's *rank* by relative difficulty among the
// holes in the round (1 = hardest), not necessarily its printed course-wide
// stroke index — see scoring.test.ts for that conversion.
describe('strokesReceived', () => {
  it('gives no stroke when rank is above the playing handicap', () => {
    expect(strokesReceived(10, 8, 18)).toBe(0)
  })

  it('gives one stroke when rank is within the playing handicap', () => {
    expect(strokesReceived(8, 8, 18)).toBe(1)
    expect(strokesReceived(1, 8, 18)).toBe(1)
  })

  it('gives zero strokes for a scratch (0) handicap', () => {
    expect(strokesReceived(1, 0, 18)).toBe(0)
  })

  it('wraps around for an 18-hole playing handicap above 18', () => {
    // playing handicap 22 on 18 holes: every hole gets 1 stroke, plus rank 1-4 get a 2nd
    expect(strokesReceived(1, 22, 18)).toBe(2)
    expect(strokesReceived(4, 22, 18)).toBe(2)
    expect(strokesReceived(5, 22, 18)).toBe(1)
    expect(strokesReceived(18, 22, 18)).toBe(1)
  })

  it('wraps around for a 9-hole playing handicap above 9', () => {
    // playing handicap 17 on 9 holes: every hole gets 1 stroke (17>=9), plus
    // the 8 hardest of those 9 get a 2nd (17-9=8) — this is the case that
    // was under-allocating strokes before the fix
    expect(strokesReceived(1, 17, 9)).toBe(2)
    expect(strokesReceived(8, 17, 9)).toBe(2)
    expect(strokesReceived(9, 17, 9)).toBe(1)
  })

  it('handles very high handicaps with multiple wraps', () => {
    // playing handicap 40 on 18 holes: 2 full wraps (36) + 4 more -> rank 1-4 get 3 strokes, rest get 2
    expect(strokesReceived(1, 40, 18)).toBe(3)
    expect(strokesReceived(4, 40, 18)).toBe(3)
    expect(strokesReceived(5, 40, 18)).toBe(2)
  })
})

describe('netPar', () => {
  it('adds strokes received to base par', () => {
    expect(netPar(4, 0)).toBe(4)
    expect(netPar(4, 1)).toBe(5)
    expect(netPar(3, 2)).toBe(5)
  })
})

describe('formatDiff', () => {
  it('formats level, under and over par', () => {
    expect(formatDiff(36, 36)).toBe('E')
    expect(formatDiff(33, 36)).toBe('-3')
    expect(formatDiff(39, 36)).toBe('+3')
  })
})
