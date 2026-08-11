import * as api from './api'
import * as db from './db'
import type { DefaultPlayerSettings } from './types'

/** Network-first, falls back to the cached copy when offline. */
export async function fetchSettings(): Promise<DefaultPlayerSettings | null> {
  try {
    const settings = await api.fetchSettings()
    if (settings) await db.saveSettingsCache(settings)
    return settings
  } catch {
    return db.getSettingsCache()
  }
}

export async function saveSettings(settings: DefaultPlayerSettings): Promise<void> {
  await db.saveSettingsCache(settings)
  void api.saveSettings(settings).catch(() => {
    // offline — next successful fetchSettings() will resync
  })
}
