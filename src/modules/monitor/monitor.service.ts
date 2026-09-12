import { prisma } from '../../db/prisma'
import { env } from '../../config/env'

const startedAt = Date.now()

function mb(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 10) / 10
}

export interface MonitorReport {
  status: 'ok' | 'degraded'
  service: string
  env: string
  node: string
  uptimeSeconds: number
  timestamp: string
  database: { status: 'up' | 'down'; latencyMs: number | null }
  memory: { rssMB: number; heapUsedMB: number }
  /** What CORS_ORIGIN actually resolved to on THIS running instance — the
   *  fastest way to catch a stale/misconfigured env var without dashboard access. */
  corsOrigins: string[]
}

export async function buildMonitor(): Promise<MonitorReport> {
  const t0 = Date.now()
  let database: MonitorReport['database'] = { status: 'down', latencyMs: null }
  try {
    await prisma.$queryRaw`SELECT 1`
    database = { status: 'up', latencyMs: Date.now() - t0 }
  } catch (err) {
    console.error('[monitor] db ping failed:', err)
  }

  const mem = process.memoryUsage()
  return {
    status: database.status === 'up' ? 'ok' : 'degraded',
    service: 'bassera-backend',
    env: env.nodeEnv,
    node: process.version,
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    database,
    memory: { rssMB: mb(mem.rss), heapUsedMB: mb(mem.heapUsed) },
    corsOrigins: env.corsOrigins,
  }
}
