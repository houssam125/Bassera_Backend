import type { Request, Response } from 'express'

import { buildOverview } from './dashboard.service'

export async function overview(_req: Request, res: Response): Promise<void> {
  res.json(await buildOverview())
}
