import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchCourses, deleteCourse } from '../lib/courses'
import type { SavedCourse } from '../lib/types'
import ConfirmDialog from '../components/ConfirmDialog'
import './CourseLibrary.css'

export default function CourseLibrary() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState<SavedCourse[]>([])
  const [pendingDelete, setPendingDelete] = useState<SavedCourse | null>(null)

  useEffect(() => {
    fetchCourses().then(setCourses)
  }, [])

  async function confirmDelete() {
    if (!pendingDelete) return
    await deleteCourse(pendingDelete.id)
    setCourses((cs) => cs.filter((c) => c.id !== pendingDelete.id))
    setPendingDelete(null)
  }

  return (
    <div className="screen">
      <div className="course-library__header">
        <h1>Saved Courses</h1>
        <button type="button" className="button button--secondary" onClick={() => navigate(-1)}>
          Back
        </button>
      </div>

      <p className="course-library__hint">
        Editing or deleting a saved course won't change any past rounds already recorded.
      </p>

      {courses.length === 0 && <p className="course-library__empty">No saved courses yet.</p>}

      <ul className="course-library__list">
        {courses.map((c) => (
          <li key={c.id} className="course-library__item card">
            <button type="button" className="course-library__item-main" onClick={() => navigate(`/courses/${c.id}/edit`)}>
              <span className="course-library__item-name">{c.name || 'Untitled Course'}</span>
              <span className="course-library__item-format">{c.format} Holes</span>
            </button>
            <button
              type="button"
              className="course-library__item-delete"
              aria-label={`Delete ${c.name}`}
              onClick={() => setPendingDelete(c)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <button type="button" className="button button--primary button--block" onClick={() => navigate('/courses/new')}>
        Add Course
      </button>

      {pendingDelete && (
        <ConfirmDialog
          title="Delete This Course?"
          body={`${pendingDelete.name || 'Untitled Course'}. This can't be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  )
}
