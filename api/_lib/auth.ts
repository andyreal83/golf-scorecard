import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Gate every /api/rounds request behind a shared secret header. This is the
 * app's only access control (there's no login) — see supabase/schema.sql
 * for why the database itself is locked down independently of this check.
 */
export function requireSecret(req: VercelRequest, res: VercelResponse): boolean {
  const expected = process.env.APP_SECRET
  const provided = req.headers['x-app-secret']
  if (!expected || provided !== expected) {
    res.status(401).json({ error: 'unauthorized' })
    return false
  }
  return true
}
