import { upsertRound, fetchRound } from './api'
import type { Round } from './types'

const PUSH_DEBOUNCE_MS = 800

let debounceTimer: ReturnType<typeof setTimeout> | null = null
let pending: Round | null = null
let pushing = false

async function attemptPush() {
  if (pushing || !pending) return
  const round = pending
  pushing = true
  try {
    await upsertRound(round)
    if (pending === round) pending = null
  } catch {
    // Offline or the request otherwise failed — leave `pending` set so the
    // next online event / retry tick picks it up. No error surfaced to the
    // user: scoring must keep feeling uninterrupted.
  } finally {
    pushing = false
  }
}

/** Call after every local edit. Debounces a background push to the server. */
export function scheduleSync(round: Round): void {
  pending = round
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    void attemptPush()
  }, PUSH_DEBOUNCE_MS)
}

/** Push immediately, e.g. when ending a round. Still fails silently offline. */
export function flushSync(round: Round): void {
  pending = round
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  void attemptPush()
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => void attemptPush())
  // Backstop retry in case the online event doesn't fire reliably on mobile browsers.
  setInterval(() => void attemptPush(), 15_000)
}

/**
 * On opening a round, compare the local copy against the server's and return
 * whichever is newer. Last-write-wins on the whole snapshot — the only
 * conflict case is the same round opened on two devices, which the brief
 * says can be handled minimally.
 */
export async function reconcile(local: Round): Promise<Round> {
  try {
    const remote = await fetchRound(local.id)
    if (!remote) return local
    return new Date(remote.updatedAt) > new Date(local.updatedAt) ? remote : local
  } catch {
    return local
  }
}
