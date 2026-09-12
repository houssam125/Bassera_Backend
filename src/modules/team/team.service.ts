import type { Prisma, UserRole } from '@prisma/client'

import { prisma } from '../../db/prisma'
import { ApiError } from '../../shared/ApiError'
import { toTeamMember, type TeamMember } from '../_shared/profile'

/** Only active accounts that have opted into the public team page. */
const VISIBLE: Prisma.UserWhereInput = { status: 'active', showOnTeam: true }

export async function listTeam(
  role?: UserRole,
): Promise<{ data: TeamMember[]; meta: { total: number } }> {
  const rows = await prisma.user.findMany({
    where: { ...VISIBLE, ...(role ? { role } : {}) },
    orderBy: [{ teamOrder: 'asc' }, { name: 'asc' }, { id: 'asc' }],
  })
  return { data: rows.map(toTeamMember), meta: { total: rows.length } }
}

export async function getTeamMember(id: string): Promise<TeamMember> {
  const user = await prisma.user.findFirst({ where: { id, ...VISIBLE } })
  if (!user) throw ApiError.notFound('Team member not found')
  return toTeamMember(user)
}
