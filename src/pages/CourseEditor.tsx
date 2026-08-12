import { useEffect, useState, type ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchCourses, newCourse, saveCourse } from '../lib/courses'
import { resizeImageFile } from '../lib/image'
import type { CourseHole, RoundFormat, SavedCourse } from '../lib/types'
import PillSelector from '../components/PillSelector'
import './CourseEditor.css'

const PAR_OPTIONS = [3, 4, 5]
// Stroke index is a property of the full 18-hole course, always 1-18 even
// when playing only 9 holes of it.
const SI_OPTIONS = Array.from({ length: 18 }, (_, i) => i + 1)

function resizeHoles(holes: CourseHole[], format: RoundFormat): CourseHole[] {
  if (holes.length === format) return holes
  if (holes.length > format) return holes.slice(0, format)
  const extra = Array.from({ length: format - holes.length }, (_, i) => ({
    number: holes.length + i + 1,
    par: 4,
    strokeIndex: holes.length + i + 1,
  }))
  return [...holes, ...extra]
}

export default function CourseEditor() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const isNew = !courseId
  const [course, setCourse] = useState<SavedCourse | null>(isNew ? newCourse(18) : null)
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (isNew || !courseId) return
    fetchCourses().then((list) => {
      setCourse(list.find((c) => c.id === courseId) ?? newCourse(18))
      setLoading(false)
    })
  }, [isNew, courseId])

  if (loading || !course) {
    return (
      <div className="screen">
        <p>Loading…</p>
      </div>
    )
  }

  const canSave = course.name.trim().length > 0

  function updateHole(number: number, patch: Partial<CourseHole>) {
    setCourse((c) => (c ? { ...c, holes: c.holes.map((h) => (h.number === number ? { ...h, ...patch } : h)) } : c))
  }

  function changeFormat(format: RoundFormat) {
    setCourse((c) => (c ? { ...c, format, holes: resizeHoles(c.holes, format) } : c))
  }

  async function handleMapFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const dataUrl = await resizeImageFile(file)
    setCourse((c) => (c ? { ...c, mapImage: dataUrl } : c))
  }

  async function handleHoleMapFile(number: number, e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const dataUrl = await resizeImageFile(file)
    updateHole(number, { mapImage: dataUrl })
  }

  async function handleSave() {
    if (!course || !canSave) return
    await saveCourse({ ...course, name: course.name.trim(), updatedAt: new Date().toISOString() })
    navigate(-1)
  }

  return (
    <div className="screen course-editor">
      <div className="course-editor__header">
        <h1>{isNew ? 'Add Course' : 'Edit Course'}</h1>
        <button type="button" className="button button--secondary" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>

      <label className="course-editor__field">
        <span>Course Name</span>
        <input
          type="text"
          value={course.name}
          onChange={(e) => setCourse((c) => (c ? { ...c, name: e.target.value } : c))}
          placeholder="Course name"
        />
      </label>

      <div className="course-editor__field">
        <span>Round Format</span>
        <div className="course-editor__format">
          {([9, 18] as const).map((f) => (
            <button
              key={f}
              type="button"
              className={`button ${course.format === f ? 'button--primary' : 'button--secondary'} button--block`}
              onClick={() => changeFormat(f)}
            >
              {f} Holes
            </button>
          ))}
        </div>
      </div>

      <div className="course-editor__field">
        <span>Course Map</span>
        {course.mapImage && (
          <img src={course.mapImage} alt="Course map preview" className="course-editor__map-preview" />
        )}
        <div className="course-editor__map-actions">
          <input type="file" accept="image/*" onChange={handleMapFile} />
          {course.mapImage && (
            <button
              type="button"
              className="button button--secondary"
              onClick={() => setCourse((c) => (c ? { ...c, mapImage: undefined } : c))}
            >
              Remove Image
            </button>
          )}
        </div>
      </div>

      <div className="course-editor__list">
        {course.holes.map((h) => (
          <div key={h.number} className="course-editor__row card">
            <span className="course-editor__hole-number">{h.number}</span>
            <PillSelector
              small
              label="Par"
              value={h.par}
              options={PAR_OPTIONS}
              onChange={(v) => updateHole(h.number, { par: v })}
            />
            <PillSelector
              small
              label="SI"
              value={h.strokeIndex}
              options={SI_OPTIONS}
              onChange={(v) => updateHole(h.number, { strokeIndex: v })}
            />
            <label className="course-editor__yards">
              <span className="course-editor__yards-label">Yds</span>
              <input
                type="number"
                inputMode="numeric"
                className="course-editor__yards-input"
                value={h.yards ?? ''}
                onChange={(e) => updateHole(h.number, { yards: e.target.value ? Number(e.target.value) : undefined })}
              />
            </label>
            <div className="course-editor__hole-map">
              <span className="course-editor__yards-label">Map</span>
              {h.mapImage ? (
                <button
                  type="button"
                  className="course-editor__hole-map-remove"
                  aria-label={`Remove map for hole ${h.number}`}
                  onClick={() => updateHole(h.number, { mapImage: undefined })}
                >
                  ✕
                </button>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    id={`hole-map-${h.number}`}
                    className="course-editor__hole-map-input"
                    onChange={(e) => handleHoleMapFile(h.number, e)}
                  />
                  <label htmlFor={`hole-map-${h.number}`} className="course-editor__hole-map-upload" aria-label={`Add map for hole ${h.number}`}>
                    📷
                  </label>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="button button--primary button--block" disabled={!canSave} onClick={handleSave}>
        Save Course
      </button>
    </div>
  )
}
