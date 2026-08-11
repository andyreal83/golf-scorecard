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
  /** bumped on every local change; used for last-write-wins sync */
  updatedAt: string
}

export interface RoundSummary {
  id: string
  status: RoundStatus
  courseName: string
  startedAt: string
  player1Name: string
  player1Score: number | null
  player1Diff: DiffLabel | null
}

export interface CourseHole {
  number: number
  par: number
  strokeIndex: number
}

export interface SavedCourse {
  id: string
  name: string
  format: RoundFormat
  holes: CourseHole[]
  updatedAt: string
}

export interface DefaultPlayerSettings {
  name: string
  handicap: number
}
