import { useRef, useState } from 'react'
import './CourseMapModal.css'

interface CourseMapModalProps {
  src: string
  onClose: () => void
}

interface Point {
  x: number
  y: number
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

const MIN_SCALE = 1
const MAX_SCALE = 5

export default function CourseMapModal({ src, onClose }: CourseMapModalProps) {
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<{
    mode: 'pan' | 'pinch' | null
    startPoint: Point
    startOffset: Point
    startDist: number
    startScale: number
  }>({ mode: null, startPoint: { x: 0, y: 0 }, startOffset: { x: 0, y: 0 }, startDist: 0, startScale: 1 })

  function onPointerDown(e: React.PointerEvent) {
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      // Some pointer sources (and synthetic/test events) don't support capture — safe to ignore.
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    if (pts.length === 1) {
      gesture.current = { mode: 'pan', startPoint: pts[0], startOffset: offset, startDist: 0, startScale: scale }
    } else if (pts.length === 2) {
      gesture.current = {
        mode: 'pinch',
        startPoint: { x: 0, y: 0 },
        startOffset: offset,
        startDist: distance(pts[0], pts[1]),
        startScale: scale,
      }
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const pts = [...pointers.current.values()]
    if (gesture.current.mode === 'pan' && pts.length === 1) {
      const dx = pts[0].x - gesture.current.startPoint.x
      const dy = pts[0].y - gesture.current.startPoint.y
      setOffset({ x: gesture.current.startOffset.x + dx, y: gesture.current.startOffset.y + dy })
    } else if (gesture.current.mode === 'pinch' && pts.length === 2) {
      const newDist = distance(pts[0], pts[1])
      const next = (gesture.current.startScale * newDist) / gesture.current.startDist
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)))
    }
  }

  function endPointer(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId)
    const pts = [...pointers.current.values()]
    if (pts.length === 1) {
      gesture.current = { mode: 'pan', startPoint: pts[0], startOffset: offset, startDist: 0, startScale: scale }
    } else {
      gesture.current.mode = null
    }
  }

  function onWheel(e: React.WheelEvent) {
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s - e.deltaY * 0.01)))
  }

  function reset() {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }

  return (
    <div className="course-map-modal__backdrop" role="dialog" aria-modal="true" aria-label="Course map">
      <button type="button" className="course-map-modal__close" aria-label="Close course map" onClick={onClose}>
        ✕
      </button>
      <div
        className="course-map-modal__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onWheel={onWheel}
        onDoubleClick={reset}
      >
        <img
          src={src}
          alt="Course map"
          className="course-map-modal__image"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          draggable={false}
        />
      </div>
    </div>
  )
}
