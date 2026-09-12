import type { Prisma, User, UserRole } from '@prisma/client'

import { prisma } from '../../db/prisma'
import { ApiError } from '../../shared/ApiError'
import { revokeAllSessions } from '../auth/auth.service'
import { recordAudit } from '../_shared/audit'
import { buildMeta, toSkipTake, type ListMeta } from '../_shared/pagination'
import type { ListUsersQuery, UpdateUserInput } from './users.schemas'

const PRIVILEGED: UserRole[] = ['admin', 'owner']

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  status: User['status']
  requestedRole: UserRole
  approvedById: string | null
  failedLogins: number
  lockedUntil: Date | null
  lastLoginAt: Date | null
  title: string | null
  bio: string | null
  avatarUrl: string | null
  profileTags: string[]
  showOnTeam: boolean
  teamOrder: number
  createdAt: Date
  updatedAt: Date
}

function toAdminUser(u: User): AdminUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    requestedRole: u.requestedRole,
    approvedById: u.approvedById,
    failedLogins: u.failedLogins,
    lockedUntil: u.lockedUntil,
    lastLoginAt: u.lastLoginAt,
    title: u.title,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    profileTags: u.profileTags,
    showOnTeam: u.showOnTeam,
    teamOrder: u.teamOrder,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }
}

export async function listUsers(
  query: ListUsersQuery,
): Promise<{ data: AdminUser[]; meta: ListMeta }> {
  const where: Prisma.UserWhereInput = {}
  if (query.status) where.status = query.status
  if (query.role) where.role = query.role
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { email: { contains: query.q, mode: 'insensitive' } },
    ]
  }

  const params = { page: query.page, pageSize: query.pageSize }
  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...toSkipTake(params),
    }),
    prisma.user.count({ where }),
  ])
  return { data: rows.map(toAdminUser), meta: buildMeta(params, total) }
}

async function mustFind(id: string): Promise<User> {
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw ApiError.notFound('User not found')
  return user
}

export async function getUser(id: string): Promise<AdminUser> {
  return toAdminUser(await mustFind(id))
}

export async function approveUser(
  id: string,
  role: Extract<UserRole, 'editor' | 'viewer' | 'admin'>,
  actorId: string,
): Promise<AdminUser> {
  const user = await mustFind(id)
  if (user.status !== 'pending') {
    throw new ApiError(409, 'Only pending accounts can be approved')
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'active', role, approvedById: actorId },
  })
  await recordAudit({
    actorId,
    action: 'user.approve',
    targetType: 'user',
    targetId: id,
    meta: { role },
  })
  return toAdminUser(updated)
}

export async function rejectUser(
  id: string,
  reason: string | undefined,
  actorId: string,
): Promise<AdminUser> {
  const user = await mustFind(id)
  if (user.status !== 'pending') {
    throw new ApiError(409, 'Only pending accounts can be rejected')
  }
  const updated = await prisma.user.update({ where: { id }, data: { status: 'rejected' } })
  await recordAudit({
    actorId,
    action: 'user.reject',
    targetType: 'user',
    targetId: id,
    meta: reason ? { reason } : undefined,
  })
  return toAdminUser(updated)
}

export async function suspendUser(
  id: string,
  reason: string | undefined,
  actorId: string,
): Promise<AdminUser> {
  if (id === actorId) throw ApiError.forbidden('You cannot suspend your own account')
  const user = await mustFind(id)
  if (user.status === 'suspended') {
    throw new ApiError(409, 'Account is already suspended')
  }
  const updated = await prisma.user.update({ where: { id }, data: { status: 'suspended' } })
  await revokeAllSessions(id)
  await recordAudit({
    actorId,
    action: 'user.suspend',
    targetType: 'user',
    targetId: id,
    meta: reason ? { reason } : undefined,
  })
  return toAdminUser(updated)
}

export async function reactivateUser(id: string, actorId: string): Promise<AdminUser> {
  const user = await mustFind(id)
  if (user.status !== 'suspended') {
    throw new ApiError(409, 'Only suspended accounts can be reactivated')
  }
  const updated = await prisma.user.update({
    where: { id },
    data: { status: 'active', failedLogins: 0, lockedUntil: null },
  })
  await recordAudit({ actorId, action: 'user.reactivate', targetType: 'user', targetId: id })
  return toAdminUser(updated)
}

const PROFILE_KEYS = [
  'name',
  'title',
  'bio',
  'avatarUrl',
  'profileTags',
  'showOnTeam',
  'teamOrder',
] as const

export async function updateUser(
  id: string,
  patch: UpdateUserInput,
  actor: { id: string; role: UserRole },
): Promise<AdminUser> {
  const user = await mustFind(id)

  const roleChanged = patch.role !== undefined && patch.role !== user.role
  if (roleChanged) {
    const touchesPrivileged =
      PRIVILEGED.includes(patch.role as UserRole) || PRIVILEGED.includes(user.role)
    if (touchesPrivileged && actor.role !== 'owner') {
      throw ApiError.forbidden('Only an owner can change roles to or from admin/owner')
    }
    if (user.role === 'owner') {
      const owners = await prisma.user.count({ where: { role: 'owner' } })
      if (owners <= 1) throw new ApiError(409, 'Cannot demote the last owner')
    }
  }

  const data: Prisma.UserUpdateInput = {}
  for (const key of PROFILE_KEYS) {
    if (patch[key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(data as any)[key] = patch[key]
    }
  }
  if (patch.role !== undefined) data.role = patch.role

  const updated = await prisma.user.update({ where: { id }, data })

  if (roleChanged) {
    await revokeAllSessions(id)
    await recordAudit({
      actorId: actor.id,
      action: 'user.role_change',
      targetType: 'user',
      targetId: id,
      meta: { from: user.role, to: patch.role },
    })
  }

  return toAdminUser(updated)
}

export async function deleteUser(id: string, actorId: string): Promise<void> {
  if (id === actorId) throw ApiError.forbidden('You cannot delete your own account')
  const user = await mustFind(id)
  if (user.role === 'owner') {
    const owners = await prisma.user.count({ where: { role: 'owner' } })
    if (owners <= 1) throw new ApiError(409, 'Cannot delete the last owner')
  }
  await prisma.user.delete({ where: { id } })
  await recordAudit({ actorId, action: 'user.delete', targetType: 'user', targetId: id })
}
