import type { UserRole, UserStatus } from '@prisma/client'

/** Identity attached to a request by `requireAuth`, decoded from the access token. */
export interface AuthUser {
  id: string
  role: UserRole
  status: UserStatus
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export {}
