import type { Plugin, ViteDevServer } from 'vite'
import { computeBlocks } from '../src/lib/scoring'

/**
 * Dev-only stand-in for the real /api/* Vercel functions, so the app can be
 * exercised end-to-end with `npm run dev` before a real Supabase project
 * exists. Purely in-memory — restarting the dev server clears it. Never
 * used in production (Vercel serves api/*.ts instead).
 */
export function mockApiPlugin(secret: string): Plugin {
  const rounds = new Map<string, any>()
  const courses = new Map<string, any>()
  let settings: { name: string; handicap: number } | null = null

  function readBody(req: any): Promise<any> {
    return new Promise((resolve) => {
      let raw = ''
      req.on('data', (chunk: Buffer) => (raw += chunk))
      req.on('end', () => resolve(raw ? JSON.parse(raw) : null))
    })
  }

  function checkSecret(req: any, res: any): boolean {
    if (!secret || req.headers['x-app-secret'] !== secret) {
      res.statusCode = 401
      res.end(JSON.stringify({ error: 'unauthorized' }))
      return false
    }
    return true
  }

  function summariseRound(r: any) {
    const player1 = r.players[0]
    const total = player1 ? computeBlocks(r).total : null
    return {
      id: r.id,
      status: r.status,
      courseName: r.courseName,
      startedAt: r.startedAt,
      player1Name: player1?.name ?? '',
      player1Score: total && total.perPlayer[player1.id]?.holesPlayed > 0 ? total.perPlayer[player1.id].gross : null,
      player1Diff: total?.perPlayer[player1?.id]?.diff ?? null,
    }
  }

  return {
    name: 'mock-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/rounds', async (req, res) => {
        res.setHeader('content-type', 'application/json')
        if (!checkSecret(req, res)) return

        const url = new URL(req.url ?? '/', 'http://localhost')
        const idMatch = url.pathname.match(/^\/([^/]+)$/)
        const id = idMatch ? decodeURIComponent(idMatch[1]) : null

        if (!id) {
          if (req.method === 'GET') {
            const status = url.searchParams.get('status')
            let list = [...rounds.values()]
            if (status) list = list.filter((r) => r.status === status)
            list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
            res.end(JSON.stringify(list.map(summariseRound)))
            return
          }
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'method not allowed' }))
          return
        }

        if (req.method === 'GET') {
          res.end(JSON.stringify(rounds.get(id) ?? null))
          return
        }
        if (req.method === 'PUT') {
          const body = await readBody(req)
          rounds.set(id, body)
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method === 'DELETE') {
          rounds.delete(id)
          res.statusCode = 204
          res.end()
          return
        }
        res.statusCode = 405
        res.end(JSON.stringify({ error: 'method not allowed' }))
      })

      server.middlewares.use('/api/courses', async (req, res) => {
        res.setHeader('content-type', 'application/json')
        if (!checkSecret(req, res)) return

        const url = new URL(req.url ?? '/', 'http://localhost')
        const idMatch = url.pathname.match(/^\/([^/]+)$/)
        const id = idMatch ? decodeURIComponent(idMatch[1]) : null

        if (!id) {
          if (req.method === 'GET') {
            const list = [...courses.values()].sort((a, b) => a.name.localeCompare(b.name))
            res.end(JSON.stringify(list))
            return
          }
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'method not allowed' }))
          return
        }

        if (req.method === 'PUT') {
          const body = await readBody(req)
          courses.set(id, body)
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method === 'DELETE') {
          courses.delete(id)
          res.statusCode = 204
          res.end()
          return
        }
        res.statusCode = 405
        res.end(JSON.stringify({ error: 'method not allowed' }))
      })

      server.middlewares.use('/api/settings', async (req, res) => {
        res.setHeader('content-type', 'application/json')
        if (!checkSecret(req, res)) return

        if (req.method === 'GET') {
          res.end(JSON.stringify(settings))
          return
        }
        if (req.method === 'PUT') {
          settings = await readBody(req)
          res.statusCode = 204
          res.end()
          return
        }
        res.statusCode = 405
        res.end(JSON.stringify({ error: 'method not allowed' }))
      })
    },
  }
}
