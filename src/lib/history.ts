import * as api from './api'
import * as db from './db'
import { computeBlocks } from './scoring'
import type { Round, RoundSummary } from './types'

function summarise(round: Round): RoundSummary {
  const player1 = round.players[0]
  const scores = round.holes
    .map((h) => (player1 ? h.scores[player1.id] : undefined))
    .filter((s): s is number => typeof s === 'number')
  const total = computeBlocks(round).total
  const player1Total = player1 ? total?.perPlayer[player1.id] : undefined
  return {
    id: round.id,
    status: round.status,
    courseName: round.courseName,
    format: round.format,
    startedAt: round.startedAt,
    rating: round.rating,
    weather: round.weather,
    player1Name: player1?.name ?? '',
    player1Score: scores.length ? scores.reduce((sum, s) => sum + s, 0) : null,
    player1Diff: player1Total?.diff ?? null,
    player1Points: player1Total && player1Total.holesPlayed > 0 ? player1Total.points : null,
  }
}

/** Called right after ending a round so Home (and the round itself) is
 * viewable immediately even with no connection yet. */
export async function upsertHistorySummary(round: Round): Promise<void> {
  const cache = await db.getHistoryCache()
  const next = [summarise(round), ...cache.filter((r) => r.id !== round.id)].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  )
  await db.saveHistoryCache(next)
  await db.saveCompletedRound(round)
}

/** Cached copy first (instant, works offline), refreshed from the server
 * when available in case it was edited from another device. */
export async function fetchCompletedRound(id: string): Promise<Round | null> {
  const cached = await db.getCompletedRound(id)
  try {
    const remote = await api.fetchRound(id)
    if (remote) {
      await db.saveCompletedRound(remote)
      return remote
    }
  } catch {
    // offline — fall through to cache
  }
  return cached
}

/** Prefers a fresh network fetch; falls back to the last cached list when offline. */
export async function fetchHistory(): Promise<RoundSummary[]> {
  try {
    const list = await api.fetchRoundSummaries('completed')
    await db.saveHistoryCache(list)
    return list
  } catch {
    return db.getHistoryCache()
  }
}

/**
 * Removes the round from the local cache immediately (so the confirm dialog
 * feels instant even offline) and fires the network delete in the
 * background — deleting old rounds is a low-stakes "clear out test data"
 * action, not something worth blocking the UI on.
 */
export async function removeFromHistory(id: string): Promise<void> {
  const cache = await db.getHistoryCache()
  await db.saveHistoryCache(cache.filter((r) => r.id !== id))
  await db.deleteCompletedRound(id)
  void api.deleteRound(id).catch(() => {
    // Offline — the row still exists server-side. Acceptable for v1: the
    // next successful fetchHistory() will only miss it if it never synced.
  })
}
