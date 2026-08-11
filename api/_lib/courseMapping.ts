import type { SavedCourse } from '../../src/lib/types'

export interface CourseRow {
  id: string
  name: string
  format: number
  holes: SavedCourse['holes']
  updated_at: string
}

export function rowToCourse(row: CourseRow): SavedCourse {
  return {
    id: row.id,
    name: row.name,
    format: row.format as SavedCourse['format'],
    holes: row.holes,
    updatedAt: row.updated_at,
  }
}

export function courseToRow(course: SavedCourse): CourseRow {
  return {
    id: course.id,
    name: course.name,
    format: course.format,
    holes: course.holes,
    updated_at: course.updatedAt,
  }
}
