import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null

/**
 * Service-role client, used only server-side. Never import this from `src/`
 * — the service role key must not reach the browser bundle.
 */
export function getSupabase() {
  if (!client) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set')
    }
    client = createClient(url, key, { auth: { persistSession: false } })
  }
  return client
}
