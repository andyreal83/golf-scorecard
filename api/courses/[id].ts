import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase } from '../_lib/supabase'
import { requireSecret } from '../_lib/auth'
import { courseToRow } from '../_lib/courseMapping'
import type { SavedCourse } from '../../src/lib/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSecret(req, res)) return

  const id = typeof req.query.id === 'string' ? req.query.id : undefined
  if (!id) {
    res.status(400).json({ error: 'missing id' })
    return
  }

  const supabase = getSupabase()

  if (req.method === 'PUT') {
    const course = req.body as SavedCourse
    if (!course || course.id !== id) {
      res.status(400).json({ error: 'body id does not match url id' })
      return
    }
    const { error } = await supabase.from('courses').upsert(courseToRow(course))
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(204).end()
    return
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) {
      res.status(500).json({ error: error.message })
      return
    }
    res.status(204).end()
    return
  }

  res.status(405).json({ error: 'method not allowed' })
}
