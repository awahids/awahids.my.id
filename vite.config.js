import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import aiFaqHandler from './api/ai-faq.js'
import aiBriefHandler from './api/ai-brief.js'

const MAX_DEV_BODY_BYTES = 1_000_000

const normalizePathname = (url = '') => {
  const pathname = String(url || '').split('?')[0].replace(/\/+$/, '')
  return pathname || '/'
}

const readRawBody = (req) =>
  new Promise((resolve, reject) => {
    if (req.method === 'GET' || req.method === 'HEAD') {
      resolve('')
      return
    }

    let body = ''

    req.on('data', (chunk) => {
      body += chunk

      if (body.length > MAX_DEV_BODY_BYTES) {
        reject(new Error('Request body too large'))
      }
    })

    req.on('end', () => resolve(body))
    req.on('error', reject)
  })

const parseBodyByContentType = (rawBody, contentType = '') => {
  if (!rawBody) return {}

  const normalizedType = String(contentType || '').toLowerCase()
  if (normalizedType.includes('application/json')) {
    try {
      return JSON.parse(rawBody)
    } catch {
      return rawBody
    }
  }

  return rawBody
}

const attachVercelLikeResponseHelpers = (res) => {
  let statusCode = 200

  res.status = (code) => {
    statusCode = Number(code) || 200
    res.statusCode = statusCode
    return res
  }

  res.json = (payload) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
    }

    res.statusCode = statusCode
    res.end(JSON.stringify(payload))
    return res
  }

  return res
}

const devApiMiddleware = () => ({
  name: 'dev-api-middleware',
  apply: 'serve',
  configureServer(server) {
    const handlers = new Map([
      ['/api/ai-faq', aiFaqHandler],
      ['/api/ai-brief', aiBriefHandler],
    ])

    server.middlewares.use(async (req, res, next) => {
      const pathname = normalizePathname(req.url)
      const handler = handlers.get(pathname)

      if (!handler) {
        next()
        return
      }

      try {
        const rawBody = await readRawBody(req)
        req.body = parseBodyByContentType(rawBody, req.headers['content-type'])
        attachVercelLikeResponseHelpers(res)

        await handler(req, res)

        if (!res.writableEnded) {
          res.statusCode = res.statusCode || 204
          res.end()
        }
      } catch (error) {
        if (res.writableEnded) return

        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(
          JSON.stringify({
            error: 'Dev API middleware failed',
            detail: error instanceof Error ? error.message : String(error),
          })
        )
      }
    })
  },
})

const mergeEnvIntoProcess = (mode) => {
  const loaded = loadEnv(mode, process.cwd(), '')

  for (const [key, value] of Object.entries(loaded)) {
    if (typeof process.env[key] === 'undefined' || process.env[key] === '') {
      process.env[key] = value
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  mergeEnvIntoProcess(mode)

  return {
    plugins: [react(), devApiMiddleware()],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('three')) {
                return 'vendor-three';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('framer-motion')) {
                return 'vendor-react';
              }
              return 'vendor';
            }
          }
        }
      }
    }
  }
})
