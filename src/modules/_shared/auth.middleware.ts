import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '@prisma/client'

import { ApiError } from '../../shared/ApiError'
import { verifyAccessToken } from '../auth/tokens'

const ROLE_RANK: Record<UserRole, number> = {
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
}

/** Populates `req.user` from a `Bearer` access token, or throws `401`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'))
  }

  try {
    const claims = verifyAccessToken(token)
    req.user = { id: claims.sub, role: claims.role, status: claims.status }
    next()
  } catch {
    next(ApiError.unauthorized('Invalid or expired access token'))
  }
}

/** Requires `req.user.status === 'active'`; use after `requireAuth`. */
export function requireActive(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) return next(ApiError.unauthorized())
  if (req.user.status !== 'active') {
    return next(ApiError.forbidden('Account is not active'))
  }
  next()
}

/** Requires the caller's role to rank at or above `min`. */
export function requireMinRole(min: UserRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized())
    if (ROLE_RANK[req.user.role] < ROLE_RANK[min]) {
      return next(ApiError.forbidden('Insufficient role'))
    }
    next()
  }
}

/** Requires the caller's role to be exactly one of `roles`. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized())
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('Insufficient role'))
    }
    next()
  }
}

export { ROLE_RANK }
