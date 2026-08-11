import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from '../_lib/supabase'
import { requireSecret } from '../_lib/auth'
import { rowToRound, roundToRow, type RoundRow } from '../_lib/mapping'
import type { Round } from '../../src/lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSecret(req, res)) return

  const id = typeof req.query.id === 'string' ? req.query.id : undefined
  if (!id) {
    res.status(400).json({ error: 'missing id' })
    return
  }

  const supabase = getSupabase()

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('rounds').select('*').eq('id', id).maybeSingle()
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(200).json(data ? rowToRound(data as RoundRow) : null)
    return
  }

  if (req.method === 'PUT') {
    const round = req.body as Round
    if (!round || round.id !== id) {
      res.status(400).json({ error: 'body id does not match url id' })
      return
    }
    const row = roundToRow(round)
    const { error } = await supabase.from('rounds').upsert(row)
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(204).end()
    return
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('rounds').delete().eq('id', id)
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(204).end()
    return
  }

  res.status(405).json({ error: 'method not allowed' })
}
