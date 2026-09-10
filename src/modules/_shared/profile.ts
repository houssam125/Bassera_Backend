import { z } from 'zod'
import type { User } from '@prisma/client'

/**
 * Public-team profile fields. Shared by self-service (`PATCH /api/auth/me`) and
 * admin (`PATCH /api/admin/users/:id`). `null` clears a value; omitting a key
 * leaves it untouched.
 */
export const profileFieldsShape = {
  title: z.string().trim().max(80).nullish(),
  bio: z.string().trim().max(500).nullish(),
  avatarUrl: z.url().nullish(),
  profileTags: z.array(z.string().trim().min(1).max(32)).max(20),
  showOnTeam: z.boolean(),
}

export interface TeamMember {
  id: string
  name: string
  role: User['role']
  title: string | null
  bio: string | null
  avatarUrl: string | null
  profileTags: string[]
}

/** Public team-card shape — no email, no account status. */
export function toTeamMember(u: User): TeamMember {
  return {
    id: u.id,
    name: u.name,
    role: u.role,
    title: u.title,
    bio: u.bio,
    avatarUrl: u.avatarUrl,
    profileTags: u.profileTags,
  }
}

export interface MeProfile extends TeamMember {
  email: string
  status: User['status']
  showOnTeam: boolean
  teamOrder: number
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

/** Full self-view returned by `GET /api/auth/me`. */
export function toMeProfile(u: User): MeProfile {
  return {
    ...toTeamMember(u),
    email: u.email,
    status: u.status,
    showOnTeam: u.showOnTeam,
    teamOrder: u.teamOrder,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }
}
