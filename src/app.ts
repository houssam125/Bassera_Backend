import express, { type Application, type Request, type Response } from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'

import { env, isProduction } from './config/env'
import apiRoutes from './modules'
import { apiLimiter } from './modules/_shared/rateLimiters'
import { LOCAL_UPLOAD_DIR } from './modules/media/drivers/local.driver'
import { notFound } from './middleware/notFound'
import { errorHandler } from './middleware/errorHandler'

export function createApp(): Application {
  const app = express()

  // Behind Render's proxy — needed for correct req.ip / secure cookies.
  app.set('trust proxy', 1)

  // Security & parsing
  app.use(helmet())

  // CORS — public marketing content (projects, capabilities, team, site
  // content, testimonials, process, health/monitor, the contact form) is
  // open to ANY origin, no cookies/tokens involved, so "everyone can use it"
  // — embed it, fetch it from anywhere, no allow-listing needed.
  //
  // `/api/auth/*` and `/api/admin/*` are the exception: they carry the
  // refresh cookie and bearer tokens, so browsers require Access-Control-
  // Allow-Credentials + a specific (non-wildcard) origin. Those stay behind
  // the CORS_ORIGIN allow-list. A single delegate (instead of two stacked
  // `cors()` calls) avoids one policy's preflight silently overriding the
  // other's.
  app.use(
    cors((req: Request, callback) => {
      const isRestricted = req.path.startsWith('/api/auth') || req.path.startsWith('/api/admin')

      if (!isRestricted) {
        callback(null, { origin: true, credentials: false })
        return
      }

      const origin = req.headers.origin
      if (!origin || env.corsOrigins.includes(origin)) {
        callback(null, { origin: true, credentials: true })
        return
      }
      // Logged so a misconfigured CORS_ORIGIN is a one-line grep away in the
      // host's logs, instead of a silent "No Access-Control-Allow-Origin" in
      // every browser that hits it.
      console.warn(
        `[cors] rejected origin "${origin}" for ${req.path} — CORS_ORIGIN allows: ${env.corsOrigins.join(', ') || '(none)'}`,
      )
      callback(null, { origin: false })
    }),
  )
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())

  // Request logging
  app.use(morgan(isProduction ? 'combined' : 'dev'))

  // Locally stored media (MEDIA_DRIVER=local)
  if (env.mediaDriver === 'local') {
    app.use('/uploads', express.static(LOCAL_UPLOAD_DIR))
  }

  // Root
  app.get('/', (_req: Request, res: Response) => {
    res.json({ name: 'bassera-backend', message: 'API is running', docs: '/api/health' })
  })

  // Feature routes (coarse per-IP rate limit on everything under /api)
  app.use('/api', apiLimiter, apiRoutes)

  // 404 + error handling (must be last)
  app.use(notFound)
  app.use(errorHandler)

  return app
}
