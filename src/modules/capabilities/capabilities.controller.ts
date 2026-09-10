import type { Request, Response } from 'express'

import { recordAudit } from '../_shared/audit'
import { parse } from '../_shared/validate'
import { CAPABILITY_META } from './capabilities.meta'
import {
  createCapabilitySchema,
  listCapabilitiesQuerySchema,
  reorderCapabilitiesSchema,
  updateCapabilitySchema,
} from './capabilities.schemas'
import {
  createCapability,
  deleteCapability,
  getCapability,
  listCapabilities,
  reorderCapabilities,
  setCapabilityVisibility,
  updateCapability,
} from './capabilities.service'

// --- public ------------------------------------------------------------------

export async function getMeta(_req: Request, res: Response): Promise<void> {
  res.json(CAPABILITY_META)
}

export async function listPublic(req: Request, res: Response): Promise<void> {
  const query = parse(listCapabilitiesQuerySchema, req.query)
  res.json(await listCapabilities(query, { forcePublished: true }))
}

export async function getPublic(req: Request, res: Response): Promise<void> {
  res.json(await getCapability(req.params.idOrSlug, { forcePublished: true }))
}

// --- admin -----------------------------------------------------------------

export async function listAdmin(req: Request, res: Response): Promise<void> {
  const query = parse(listCapabilitiesQuerySchema, req.query)
  res.json(await listCapabilities(query, { forcePublished: false }))
}

export async function getAdmin(req: Request, res: Response): Promise<void> {
  res.json(await getCapability(req.params.id, { forcePublished: false }))
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = parse(createCapabilitySchema, req.body)
  const cap = await createCapability(input)
  await recordAudit({
    actorId: req.user?.id,
    action: 'capability.create',
    targetType: 'capability',
    targetId: cap.id,
    meta: { division: cap.division },
  })
  res.status(201).json(cap)
}

export async function update(req: Request, res: Response): Promise<void> {
  const patch = parse(updateCapabilitySchema, req.body)
  const cap = await updateCapability(req.params.id, patch)
  await recordAudit({
    actorId: req.user?.id,
    action: 'capability.update',
    targetType: 'capability',
    targetId: req.params.id,
    meta: { fields: Object.keys(patch) },
  })
  res.json(cap)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteCapability(req.params.id)
  await recordAudit({
    actorId: req.user?.id,
    action: 'capability.delete',
    targetType: 'capability',
    targetId: req.params.id,
  })
  res.status(204).send()
}

export async function publish(req: Request, res: Response): Promise<void> {
  const cap = await setCapabilityVisibility(req.params.id, 'published')
  await recordAudit({
    actorId: req.user?.id,
    action: 'capability.publish',
    targetType: 'capability',
    targetId: req.params.id,
  })
  res.json(cap)
}

export async function unpublish(req: Request, res: Response): Promise<void> {
  const cap = await setCapabilityVisibility(req.params.id, 'draft')
  await recordAudit({
    actorId: req.user?.id,
    action: 'capability.unpublish',
    targetType: 'capability',
    targetId: req.params.id,
  })
  res.json(cap)
}

export async function reorder(req: Request, res: Response): Promise<void> {
  const { items } = parse(reorderCapabilitiesSchema, req.body)
  await reorderCapabilities(items)
  await recordAudit({
    actorId: req.user?.id,
    action: 'capability.reorder',
    meta: { count: items.length },
  })
  res.json({ data: items, meta: { total: items.length } })
}
