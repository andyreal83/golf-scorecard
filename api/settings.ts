import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from './_lib/supabase'
import { requireSecret } from './_lib/auth'
import type { DefaultPlayerSettings } from '../src/lib/types'

const SETTINGS_ID = 'default'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSecret(req, res)) return

  const supabase = getSupabase()

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('app_settings')
      .select('default_name, default_handicap')
      .eq('id', SETTINGS_ID)
      .maybeSingle()
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    const settings: DefaultPlayerSettings | null = data
      ? { name: data.default_name ?? '', handicap: data.default_handicap ?? 0 }
      : null
    res.status(200).json(settings)
    return
  }

  if (req.method === 'PUT') {
    const body = req.body as DefaultPlayerSettings
    const { error } = await supabase
      .from('app_settings')
      .upsert({ id: SETTINGS_ID, default_name: body.name, default_handicap: body.handicap })
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(204).end()
    return
  }

  res.status(405).json({ error: 'method not allowed' })
}
