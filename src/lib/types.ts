export type { RoundFormat } from './handicap'
import type { RoundFormat } from './handicap'
import type { DiffLabel } from './handicap'

export interface Player {
  id: string
  name: string
  handicap: number
}

export interface Hole {
  number: number
  par: number
  strokeIndex: number
  /** Only ever set via Course Setup or a saved course — not editable on Hole Entry. */
  yards?: number
  /** Only ever set via a saved course — not editable on Hole Entry. Falls back to
   * the round's overall mapImage on Hole Entry when a hole doesn't have its own. */
  mapImage?: string
  /** playerId -> gross strokes taken */
  scores: Record<string, number>
}

export type RoundStatus = 'in_progress' | 'completed'

export const WEATHER_TAGS = ['dry', 'drizzle', 'wet', 'breezy', 'windy'] as const
export type WeatherTag = (typeof WEATHER_TAGS)[number]

export interface Round {
  id: string
  status: RoundStatus
  courseName: string
  format: RoundFormat
  startedAt: string
  endedAt: string | null
  rating: number | null
  notes: string
  weather: WeatherTag[]
  players: Player[]
  holes: Hole[]
  /** Snapshot copy of the saved course's map image at the time the round was started, if any. */
  mapImage?: string
  /** bumped on every local change; used for last-write-wins sync */
  updatedAt: string
}

export interface RoundSummary {
  id: string
  status: RoundStatus
  courseName: string
  format: RoundFormat
  startedAt: string
  rating: number | null
  weather: WeatherTag[]
  player1Name: string
  player1Score: number | null
  player1Diff: DiffLabel | null
  player1Points: number | null
}

export interface CourseHole {
  number: number
  par: number
  strokeIndex: number
  yards?: number
  /** Optional per-hole map image — takes priority over the course's overall mapImage when set. */
  mapImage?: string
}

export interface SavedCourse {
  id: string
  name: string
  format: RoundFormat
  holes: CourseHole[]
  /** A single image of the course/hole map, stored as a data URL. */
  mapImage?: string
  updatedAt: string
}

export interface DefaultPlayerSettings {
  name: string
  handicap: number
}
