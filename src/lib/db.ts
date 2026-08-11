import { openDB, type IDBPDatabase } from 'idb'
import type { DefaultPlayerSettings, Round, RoundSummary, SavedCourse } from './types'

const DB_NAME = 'golf-scorecard'
const DB_VERSION = 2
const ACTIVE_STORE = 'activeRound'
const HISTORY_STORE = 'historyCache'
const COMPLETED_STORE = 'completedRounds'
const COURSES_STORE = 'courses'
const SETTINGS_STORE = 'settings'
const ACTIVE_KEY = 'current'

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(ACTIVE_STORE)) {
          db.createObjectStore(ACTIVE_STORE)
        }
        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          db.createObjectStore(HISTORY_STORE)
        }
        if (!db.objectStoreNames.contains(COMPLETED_STORE)) {
          db.createObjectStore(COMPLETED_STORE)
        }
        if (!db.objectStoreNames.contains(COURSES_STORE)) {
          db.createObjectStore(COURSES_STORE)
        }
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE)
        }
      },
    })
  }
  return dbPromise
}

export async function getActiveRound(): Promise<Round | null> {
  const db = await getDb()
  const round = await db.get(ACTIVE_STORE, ACTIVE_KEY)
  return round ?? null
}

export async function saveActiveRound(round: Round): Promise<void> {
  const db = await getDb()
  await db.put(ACTIVE_STORE, round, ACTIVE_KEY)
}

export async function clearActiveRound(): Promise<void> {
  const db = await getDb()
  await db.delete(ACTIVE_STORE, ACTIVE_KEY)
}

export async function getHistoryCache(): Promise<RoundSummary[]> {
  const db = await getDb()
  const cached = await db.get(HISTORY_STORE, 'list')
  return cached ?? []
}

export async function saveHistoryCache(list: RoundSummary[]): Promise<void> {
  const db = await getDb()
  await db.put(HISTORY_STORE, list, 'list')
}

/** Cache of full completed-round detail, keyed by id — lets a round just
 * ended stay viewable immediately even with no connection yet. */
export async function getCompletedRound(id: string): Promise<Round | null> {
  const db = await getDb()
  const round = await db.get(COMPLETED_STORE, id)
  return round ?? null
}

export async function saveCompletedRound(round: Round): Promise<void> {
  const db = await getDb()
  await db.put(COMPLETED_STORE, round, round.id)
}

export async function deleteCompletedRound(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(COMPLETED_STORE, id)
}

export async function getCoursesCache(): Promise<SavedCourse[]> {
  const db = await getDb()
  const cached = await db.get(COURSES_STORE, 'list')
  return cached ?? []
}

export async function saveCoursesCache(list: SavedCourse[]): Promise<void> {
  const db = await getDb()
  await db.put(COURSES_STORE, list, 'list')
}

export async function getSettingsCache(): Promise<DefaultPlayerSettings | null> {
  const db = await getDb()
  const cached = await db.get(SETTINGS_STORE, 'default')
  return cached ?? null
}

export async function saveSettingsCache(settings: DefaultPlayerSettings): Promise<void> {
  const db = await getDb()
  await db.put(SETTINGS_STORE, settings, 'default')
}
