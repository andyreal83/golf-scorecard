import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from '../_lib/supabase'
import { requireSecret } from '../_lib/auth'
import { rowToCourse, type CourseRow } from '../_lib/courseMapping'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSecret(req, res)) return

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method not allowed' })
    return
  }

  const supabase = getSupabase()
  const { data, error } = await supabase.from('courses').select('*').order('name', { ascending: true })
  if (error) {
    res.status(500).json({ error: error.message })
    return
  }

  res.status(200).json((data ?? []).map((row) => rowToCourse(row as CourseRow)))
}
