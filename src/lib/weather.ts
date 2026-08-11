import type { WeatherTag } from './types'

export const WEATHER_ICONS: Record<WeatherTag, string> = {
  dry: '☀️',
  drizzle: '🌦️',
  wet: '🌧️',
  breezy: '🍃',
  windy: '💨',
}

export const WEATHER_LABELS: Record<WeatherTag, string> = {
  dry: 'Dry',
  drizzle: 'Drizzle',
  wet: 'Wet',
  breezy: 'Breezy',
  windy: 'Windy',
}
