import crypto from 'node:crypto'

import jwt from 'jsonwebtoken'
import type { UserRole, UserStatus } from '@prisma/client'

import { env } from '../../config/env'

export interface AccessClaims {
  sub: string
  role: UserRole
  status: UserStatus
}

export function signAccessToken(claims: AccessClaims): string {
  return jwt.sign(claims, env.jwtAccessSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtAccessTtl,
  })
}

export function verifyAccessToken(token: string): AccessClaims {
  const decoded = jwt.verify(token, env.jwtAccessSecret, { algorithms: ['HS256'] })
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Malformed access token')
  }
  return {
    sub: String(decoded.sub),
    role: decoded.role as UserRole,
    status: decoded.status as UserStatus,
  }
}

/** A fresh opaque refresh token plus its SHA-256 hash (only the hash is stored). */
export function createRefreshToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString('base64url')
  return { token, hash: hashRefreshToken(token) }
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}
