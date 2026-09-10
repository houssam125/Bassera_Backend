import { prisma } from '../../db/prisma'

export interface DatabaseHealth {
  status: 'up' | 'down'
  latencyMs: number | null
}

/** Trivial round-trip query to confirm the database is reachable. */
export async function pingDatabase(): Promise<DatabaseHealth> {
  const startedAt = Date.now()
  try {
    await prisma.$queryRaw`SELECT 1`
    return { status: 'up', latencyMs: Date.now() - startedAt }
  } catch (err) {
    console.error('[health] database ping failed:', err)
    return { status: 'down', latencyMs: null }
  }
}

/**
 * Records one row on every process start. Acts as a deploy marker and proves
 * that migrations ran and the app has write access to the database.
 */
export async function recordStartup(): Promise<void> {
  await prisma.healthCheck.create({ data: {} })
}
