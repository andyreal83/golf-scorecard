import { useState } from 'react'
import { WEATHER_TAGS, type WeatherTag } from '../lib/types'
import { WEATHER_ICONS, WEATHER_LABELS } from '../lib/weather'
import './ConfirmDialog.css'
import './RatingPrompt.css'

interface RatingPromptProps {
  onSubmit: (rating: number, notes: string, weather: WeatherTag[]) => void
}

export default function RatingPrompt({ onSubmit }: RatingPromptProps) {
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [weather, setWeather] = useState<WeatherTag[]>([])

  function toggleWeather(tag: WeatherTag) {
    setWeather((w) => (w.includes(tag) ? w.filter((t) => t !== tag) : [...w, tag]))
  }

  return (
    <div className="confirm-dialog__backdrop" role="dialog" aria-modal="true">
      <div className="confirm-dialog card rating-prompt">
        <h2 className="confirm-dialog__title">How Was the Round?</h2>
        <div className="rating-prompt__stars">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} out of 5`}
              className={`rating-prompt__star${n <= rating ? ' rating-prompt__star--active' : ''}`}
              onClick={() => setRating(n)}
            >
              ★
            </button>
          ))}
        </div>

        <div className="rating-prompt__weather">
          {WEATHER_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              aria-label={WEATHER_LABELS[tag]}
              aria-pressed={weather.includes(tag)}
              className={`rating-prompt__weather-icon${weather.includes(tag) ? ' rating-prompt__weather-icon--active' : ''}`}
              onClick={() => toggleWeather(tag)}
            >
              <span aria-hidden="true">{WEATHER_ICONS[tag]}</span>
              <span className="rating-prompt__weather-label">{WEATHER_LABELS[tag]}</span>
            </button>
          ))}
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any notes on the round? (optional)"
        />

        <div className="confirm-dialog__actions">
          <button
            type="button"
            className="button button--primary button--block"
            disabled={rating === 0}
            onClick={() => onSubmit(rating, notes.trim(), weather)}
          >
            End Round
          </button>
        </div>
      </div>
    </div>
  )
}
