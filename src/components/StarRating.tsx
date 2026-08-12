import './StarRating.css'

export default function StarRating({ rating, className = '' }: { rating: number; className?: string }) {
  return (
    <span className={`star-rating ${className}`.trim()}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rating ? 'star-rating__star--active' : 'star-rating__star'}>
          ★
        </span>
      ))}
    </span>
  )
}
