import type { Request, Response } from 'express'

import { recordAudit } from '../_shared/audit'
import { parse } from '../_shared/validate'
import {
  createProcessStepSchema,
  listProcessStepsQuerySchema,
  reorderProcessStepsSchema,
  updateProcessStepSchema,
} from './process.schemas'
import {
  createProcessStep,
  deleteProcessStep,
  getProcessStep,
  listProcessSteps,
  reorderProcessSteps,
  setProcessStepVisibility,
  updateProcessStep,
} from './process.service'

// --- public ------------------------------------------------------------------

export async function listPublic(req: Request, res: Response): Promise<void> {
  const query = parse(listProcessStepsQuerySchema, req.query)
  res.json(await listProcessSteps(query, { forcePublished: true }))
}

// --- admin -----------------------------------------------------------------

export async function listAdmin(req: Request, res: Response): Promise<void> {
  const query = parse(listProcessStepsQuerySchema, req.query)
  res.json(await listProcessSteps(query, { forcePublished: false }))
}

export async function getAdmin(req: Request, res: Response): Promise<void> {
  res.json(await getProcessStep(req.params.id, { forcePublished: false }))
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = parse(createProcessStepSchema, req.body)
  const row = await createProcessStep(input)
  await recordAudit({
    actorId: req.user?.id,
    action: 'processStep.create',
    targetType: 'processStep',
    targetId: row.id,
    meta: { title: row.title },
  })
  res.status(201).json(row)
}

export async function update(req: Request, res: Response): Promise<void> {
  const patch = parse(updateProcessStepSchema, req.body)
  const row = await updateProcessStep(req.params.id, patch)
  await recordAudit({
    actorId: req.user?.id,
    action: 'processStep.update',
    targetType: 'processStep',
    targetId: req.params.id,
    meta: { fields: Object.keys(patch) },
  })
  res.json(row)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteProcessStep(req.params.id)
  await recordAudit({
    actorId: req.user?.id,
    action: 'processStep.delete',
    targetType: 'processStep',
    targetId: req.params.id,
  })
  res.status(204).send()
}

export async function publish(req: Request, res: Response): Promise<void> {
  const row = await setProcessStepVisibility(req.params.id, 'published')
  await recordAudit({
    actorId: req.user?.id,
    action: 'processStep.publish',
    targetType: 'processStep',
    targetId: req.params.id,
  })
  res.json(row)
}

export async function unpublish(req: Request, res: Response): Promise<void> {
  const row = await setProcessStepVisibility(req.params.id, 'draft')
  await recordAudit({
    actorId: req.user?.id,
    action: 'processStep.unpublish',
    targetType: 'processStep',
    targetId: req.params.id,
  })
  res.json(row)
}

export async function reorder(req: Request, res: Response): Promise<void> {
  const { items } = parse(reorderProcessStepsSchema, req.body)
  await reorderProcessSteps(items)
  await recordAudit({
    actorId: req.user?.id,
    action: 'processStep.reorder',
    meta: { count: items.length },
  })
  res.json({ data: items, meta: { total: items.length } })
}
