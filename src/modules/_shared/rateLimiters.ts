import type { Request, Response } from 'express'
import { ipKeyGenerator, rateLimit, type Options } from 'express-rate-limit'

import { env } from '../../config/env'

type WithRateLimit = Request & { rateLimit?: { resetTime?: Date } }

function retryAfterHandler(windowMs: number) {
  return (req: Request, res: Response): void => {
    const reset = (req as WithRateLimit).rateLimit?.resetTime
    const seconds = reset
      ? Math.max(1, Math.ceil((reset.getTime() - Date.now()) / 1000))
      : Math.ceil(windowMs / 1000)
    res.setHeader('Retry-After', String(seconds))
    res.status(429).json({ status: 'error', message: `Too many requests, retry in ${seconds}s` })
  }
}

function make(opts: Pick<Options, 'windowMs' | 'limit'> & { byUser?: boolean }) {
  const { windowMs, limit, byUser } = opts
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: retryAfterHandler(windowMs),
    keyGenerator: byUser
      ? (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip ?? '')
      : undefined,
  })
}

const MIN = 60_000

/** All `/api/*` — coarse IP throttle. */
export const apiLimiter = make({ windowMs: env.rateLimitWindowMs, limit: env.rateLimitMax })

/** `POST /api/auth/login` and `/register`. */
export const authLimiter = make({ windowMs: 15 * MIN, limit: 10 })

/** `POST /api/auth/refresh`. */
export const refreshLimiter = make({ windowMs: 15 * MIN, limit: 60 })

/** `POST /api/admin/media` — keyed by user. */
export const mediaLimiter = make({ windowMs: 10 * MIN, limit: 30, byUser: true })

/** `POST /api/inquiries` — public contact form, keep spam down. */
export const inquiryLimiter = make({ windowMs: 60 * MIN, limit: 5 })

/** Mutations under `/api/admin/*` — keyed by user, only for write verbs. */
const adminMutations = make({ windowMs: 5 * MIN, limit: 120, byUser: true })
export function adminMutationLimiter(req: Request, res: Response, next: (err?: unknown) => void): void {
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    return adminMutations(req, res, next)
  }
  next()
}
