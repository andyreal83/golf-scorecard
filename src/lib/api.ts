import type { DefaultPlayerSettings, Round, RoundSummary, SavedCourse } from './types'

const APP_SECRET = import.meta.env.VITE_APP_SECRET as string | undefined

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-app-secret': APP_SECRET ?? '',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`API ${path} failed: ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export function fetchRoundSummaries(status?: 'completed' | 'in_progress'): Promise<RoundSummary[]> {
  const qs = status ? `?status=${status}` : ''
  return request<RoundSummary[]>(`/rounds${qs}`)
}

export function fetchRound(id: string): Promise<Round | null> {
  return request<Round | null>(`/rounds/${id}`)
}

export function upsertRound(round: Round): Promise<void> {
  return request<void>(`/rounds/${round.id}`, {
    method: 'PUT',
    body: JSON.stringify(round),
  })
}

export function deleteRound(id: string): Promise<void> {
  return request<void>(`/rounds/${id}`, { method: 'DELETE' })
}

export function fetchCourses(): Promise<SavedCourse[]> {
  return request<SavedCourse[]>('/courses')
}

export function upsertCourse(course: SavedCourse): Promise<void> {
  return request<void>(`/courses/${course.id}`, {
    method: 'PUT',
    body: JSON.stringify(course),
  })
}

export function deleteCourse(id: string): Promise<void> {
  return request<void>(`/courses/${id}`, { method: 'DELETE' })
}

export function fetchSettings(): Promise<DefaultPlayerSettings | null> {
  return request<DefaultPlayerSettings | null>('/settings')
}

export function saveSettings(settings: DefaultPlayerSettings): Promise<void> {
  return request<void>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  })
}
