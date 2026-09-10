import bcrypt from 'bcryptjs'
import type { User } from '@prisma/client'

import { env } from '../../config/env'
import { prisma } from '../../db/prisma'
import { ApiError } from '../../shared/ApiError'
import { recordAudit } from '../_shared/audit'
import { toMeProfile, type MeProfile } from '../_shared/profile'
import type { LoginInput, RegisterInput, UpdateMeInput } from './auth.schemas'
import {
  createRefreshToken,
  hashRefreshToken,
  signAccessToken,
} from './tokens'

const LOCK_THRESHOLD = 5
const LOCK_MS = 15 * 60 * 1000

export interface RequestContext {
  ip?: string
  userAgent?: string
}

export interface PublicUser {
  id: string
  name: string
  email: string
  role: User['role']
  status: User['status']
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  }
}

// ---------------------------------------------------------------------------
// register
// ---------------------------------------------------------------------------

export async function registerUser(
  input: RegisterInput,
): Promise<{ status: User['status']; message: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists')
  }

  const isBootstrap =
    env.bootstrapAdminEmail.length > 0 && input.email === env.bootstrapAdminEmail

  const passwordHash = await bcrypt.hash(input.password, env.bcryptCost)

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      requestedRole: isBootstrap ? 'owner' : input.requestedRole,
      role: isBootstrap ? 'owner' : input.requestedRole,
      status: isBootstrap ? 'active' : 'pending',
    },
  })

  await recordAudit({
    actorId: user.id,
    action: 'user.register',
    targetType: 'user',
    targetId: user.id,
    meta: { requestedRole: user.requestedRole, bootstrap: isBootstrap },
  })

  if (isBootstrap) {
    return { status: 'active', message: 'Owner account created. You can sign in now.' }
  }
  return {
    status: 'pending',
    message:
      'Account created. An administrator must approve it before you can sign in.',
  }
}

// ---------------------------------------------------------------------------
// login
// ---------------------------------------------------------------------------

function statusRejectionMessage(status: User['status']): string {
  switch (status) {
    case 'pending':
      return 'Account awaiting approval'
    case 'suspended':
      return 'Account suspended'
    case 'rejected':
      return 'Account rejected'
    default:
      return 'Account is not active'
  }
}

export interface LoginResult {
  user: PublicUser
  accessToken: string
  accessTokenExpiresIn: number
  refreshToken: string
}

export async function loginUser(
  input: LoginInput,
  ctx: RequestContext,
): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } })

  // Uniform response for "no such user" to avoid enumeration.
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password')
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const secs = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000)
    const err = new ApiError(429, `Too many failed attempts, retry in ${secs}s`)
    throw err
  }

  const ok = await bcrypt.compare(input.password, user.passwordHash)
  if (!ok) {
    const failedLogins = user.failedLogins + 1
    const hitThreshold = failedLogins >= LOCK_THRESHOLD
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: hitThreshold ? 0 : failedLogins,
        lockedUntil: hitThreshold ? new Date(Date.now() + LOCK_MS) : user.lockedUntil,
      },
    })
    if (hitThreshold) {
      throw new ApiError(429, `Too many failed attempts, retry in ${Math.ceil(LOCK_MS / 1000)}s`)
    }
    throw ApiError.unauthorized('Invalid email or password')
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden(statusRejectionMessage(user.status))
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() },
  })

  return issueSession(user, ctx)
}

// ---------------------------------------------------------------------------
// session issue / refresh / logout
// ---------------------------------------------------------------------------

async function issueSession(user: User, ctx: RequestContext): Promise<LoginResult> {
  const { token, hash } = createRefreshToken()
  await prisma.session.create({
    data: {
      userId: user.id,
      refreshTokenHash: hash,
      userAgent: ctx.userAgent ?? null,
      ip: ctx.ip ?? null,
      expiresAt: new Date(Date.now() + env.refreshTokenTtl * 1000),
    },
  })

  return {
    user: toPublicUser(user),
    accessToken: signAccessToken({ sub: user.id, role: user.role, status: user.status }),
    accessTokenExpiresIn: env.jwtAccessTtl,
    refreshToken: token,
  }
}

export interface RefreshResult {
  accessToken: string
  accessTokenExpiresIn: number
  refreshToken: string
}

export async function refreshSession(
  rawToken: string | undefined,
  ctx: RequestContext,
): Promise<RefreshResult> {
  if (!rawToken) throw ApiError.unauthorized('Missing refresh token')

  const hash = hashRefreshToken(rawToken)
  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: hash },
    include: { user: true },
  })

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined)
    }
    throw ApiError.unauthorized('Refresh token is invalid or expired')
  }

  if (session.user.status !== 'active') {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined)
    throw ApiError.forbidden(statusRejectionMessage(session.user.status))
  }

  // Rotate: drop the presented session, mint a new one.
  const { token, hash: nextHash } = createRefreshToken()
  await prisma.session.update({
    where: { id: session.id },
    data: {
      refreshTokenHash: nextHash,
      userAgent: ctx.userAgent ?? session.userAgent,
      ip: ctx.ip ?? session.ip,
      expiresAt: new Date(Date.now() + env.refreshTokenTtl * 1000),
      createdAt: new Date(),
    },
  })

  return {
    accessToken: signAccessToken({
      sub: session.user.id,
      role: session.user.role,
      status: session.user.status,
    }),
    accessTokenExpiresIn: env.jwtAccessTtl,
    refreshToken: token,
  }
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return
  await prisma.session
    .deleteMany({ where: { refreshTokenHash: hashRefreshToken(rawToken) } })
    .catch(() => undefined)
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } })
}

// ---------------------------------------------------------------------------
// me
// ---------------------------------------------------------------------------

export async function getMe(userId: string): Promise<MeProfile> {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw ApiError.unauthorized()
  return toMeProfile(user)
}

/** A user updating their own profile (name + public team fields). */
export async function updateMyProfile(
  userId: string,
  patch: UpdateMeInput,
): Promise<MeProfile> {
  const data: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) data[key] = value
  }
  const user = await prisma.user.update({ where: { id: userId }, data })
  return toMeProfile(user)
}
