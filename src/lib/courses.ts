import * as api from './api'
import * as db from './db'
import { makeId } from './id'
import type { RoundFormat, SavedCourse } from './types'

/** Network-first, falls back to the last cached list when offline. */
export async function fetchCourses(): Promise<SavedCourse[]> {
  try {
    const list = await api.fetchCourses()
    await db.saveCoursesCache(list)
    return list
  } catch {
    return db.getCoursesCache()
  }
}

export function newCourse(format: RoundFormat): SavedCourse {
  return {
    id: makeId(),
    name: '',
    format,
    holes: Array.from({ length: format }, (_, i) => ({ number: i + 1, par: 4, strokeIndex: i + 1 })),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * Saves the course and updates the local cache immediately so the library
 * screen reflects it even offline; the network write happens in the
 * background (this is reference data edited occasionally, not something
 * worth blocking on).
 */
export async function saveCourse(course: SavedCourse): Promise<void> {
  const cache = await db.getCoursesCache()
  const next = [course, ...cache.filter((c) => c.id !== course.id)].sort((a, b) => a.name.localeCompare(b.name))
  await db.saveCoursesCache(next)
  void api.upsertCourse(course).catch(() => {
    // offline — next successful fetchCourses() will resync
  })
}

export async function deleteCourse(id: string): Promise<void> {
  const cache = await db.getCoursesCache()
  await db.saveCoursesCache(cache.filter((c) => c.id !== id))
  void api.deleteCourse(id).catch(() => {
    // offline — acceptable for this low-stakes reference data
  })
}
