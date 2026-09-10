import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { buildMonitor } from './monitor.service'

// Public ops endpoint — richer than /api/health. Point uptime monitors here.
const router = Router()

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const report = await buildMonitor()
    res.status(report.status === 'ok' ? 200 : 503).json(report)
  }),
)

export default router
