import { useRef } from 'react'

const SWIPE_THRESHOLD_PX = 50

/**
 * Pointer-event based swipe detection (unifies touch and mouse, so it also
 * works via drag in a desktop browser). No gesture library needed at this
 * scope — a simple horizontal-distance threshold is reliable enough for
 * "next/previous hole" and avoids pulling in a dependency for one gesture.
 */
export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)

  return {
    onPointerDown(e: React.PointerEvent) {
      startX.current = e.clientX
      startY.current = e.clientY
    },
    onPointerUp(e: React.PointerEvent) {
      if (startX.current === null || startY.current === null) return
      const dx = e.clientX - startX.current
      const dy = e.clientY - startY.current
      startX.current = null
      startY.current = null
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return
      if (dx < 0) onSwipeLeft()
      else onSwipeRight()
    },
  }
}
