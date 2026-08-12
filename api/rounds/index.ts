import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from '../_lib/supabase'
import { requireSecret } from '../_lib/auth'
import type { RoundSummary } from '../../src/lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSecret(req, res)) return

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  const status = typeof req.query.status === 'string' ? req.query.status : undefined
  const supabase = getSupabase()
  let query = supabase
    .from('rounds')
    .select(
      'id, status, course_name, format, started_at, rating, weather, player1_name, player1_score, player1_diff, player1_points',
    )
    .order('started_at', { ascending: false })

  if (status === 'completed' || status === 'in_progress') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  const summaries: RoundSummary[] = (data ?? []).map((row) => ({
    id: row.id,
    status: row.status,
    courseName: row.course_name,
    format: row.format,
    startedAt: row.started_at,
    rating: row.rating,
    weather: row.weather ?? [],
    player1Name: row.player1_name,
    player1Score: row.player1_score,
    player1Diff: row.player1_diff,
    player1Points: row.player1_points,
  }))

  res.status(200).json(summaries)
}
