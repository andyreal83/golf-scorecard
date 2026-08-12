interface GolfBallIconProps {
  size?: number
}

export default function GolfBallIcon({ size = 12 }: GolfBallIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden="true" className="golf-ball-icon">
      <circle cx="6" cy="6" r="5" fill="#f5d90a" stroke="#c9b400" strokeWidth="0.5" />
      <circle cx="4.2" cy="4.2" r="0.6" fill="#c9b400" />
      <circle cx="7.2" cy="4.4" r="0.6" fill="#c9b400" />
      <circle cx="5.8" cy="7.2" r="0.6" fill="#c9b400" />
    </svg>
  )
}
