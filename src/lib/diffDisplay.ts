import type { DiffLabel } from './handicap'

export function diffClassName(diff: DiffLabel | null): string {
  if (diff === null || diff === 'E') return 'diff--level'
  return diff.startsWith('-') ? 'diff--under' : 'diff--over'
}

export function diffText(diff: DiffLabel | null): string {
  return diff ?? '–'
}
