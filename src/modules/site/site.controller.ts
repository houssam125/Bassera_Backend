import type { Request, Response } from 'express'

import { recordAudit } from '../_shared/audit'
import { parse } from '../_shared/validate'
import { updateSiteSchema } from './site.schemas'
import { getSiteContent, updateSiteContent } from './site.service'

export async function getPublic(_req: Request, res: Response): Promise<void> {
  res.json(await getSiteContent())
}

export async function patchAdmin(req: Request, res: Response): Promise<void> {
  const patch = parse(updateSiteSchema, req.body)
  const site = await updateSiteContent(patch)
  await recordAudit({
    actorId: req.user?.id,
    action: 'site.update',
    targetType: 'site',
    meta: { fields: Object.keys(patch) },
  })
  res.json(site)
}
