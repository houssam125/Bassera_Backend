import type { Request, Response } from 'express'

import { pingDatabase } from './health.service'

const startedAt = Date.now()

/** GET /api/health — liveness probe plus database readiness. */
export async function getHealth(_req: Request, res: Response): Promise<void> {
  const database = await pingDatabase()
  const healthy = database.status === 'up'

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    service: 'bassera-backend',
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    timestamp: new Date().toISOString(),
    database,
  })
}
