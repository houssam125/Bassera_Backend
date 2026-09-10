import type { Request, Response } from 'express'

import { recordAudit } from '../_shared/audit'
import { parse } from '../_shared/validate'
import {
  createClientSchema,
  listClientsQuerySchema,
  reorderClientsSchema,
  updateClientSchema,
} from './clients.schemas'
import {
  createClient,
  deleteClient,
  getClient,
  listClients,
  reorderClients,
  setClientVisibility,
  updateClient,
} from './clients.service'

// --- public ------------------------------------------------------------------

export async function listPublic(req: Request, res: Response): Promise<void> {
  const query = parse(listClientsQuerySchema, req.query)
  res.json(await listClients(query, { forcePublished: true }))
}

export async function getPublic(req: Request, res: Response): Promise<void> {
  res.json(await getClient(req.params.idOrSlug, { forcePublished: true }))
}

// --- admin -----------------------------------------------------------------

export async function listAdmin(req: Request, res: Response): Promise<void> {
  const query = parse(listClientsQuerySchema, req.query)
  res.json(await listClients(query, { forcePublished: false }))
}

export async function getAdmin(req: Request, res: Response): Promise<void> {
  res.json(await getClient(req.params.id, { forcePublished: false }))
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = parse(createClientSchema, req.body)
  const client = await createClient(input)
  await recordAudit({
    actorId: req.user?.id,
    action: 'client.create',
    targetType: 'client',
    targetId: client.id,
    meta: { name: client.name },
  })
  res.status(201).json(client)
}

export async function update(req: Request, res: Response): Promise<void> {
  const patch = parse(updateClientSchema, req.body)
  const client = await updateClient(req.params.id, patch)
  await recordAudit({
    actorId: req.user?.id,
    action: 'client.update',
    targetType: 'client',
    targetId: req.params.id,
    meta: { fields: Object.keys(patch) },
  })
  res.json(client)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteClient(req.params.id)
  await recordAudit({
    actorId: req.user?.id,
    action: 'client.delete',
    targetType: 'client',
    targetId: req.params.id,
  })
  res.status(204).send()
}

export async function publish(req: Request, res: Response): Promise<void> {
  const client = await setClientVisibility(req.params.id, 'published')
  await recordAudit({
    actorId: req.user?.id,
    action: 'client.publish',
    targetType: 'client',
    targetId: req.params.id,
  })
  res.json(client)
}

export async function unpublish(req: Request, res: Response): Promise<void> {
  const client = await setClientVisibility(req.params.id, 'draft')
  await recordAudit({
    actorId: req.user?.id,
    action: 'client.unpublish',
    targetType: 'client',
    targetId: req.params.id,
  })
  res.json(client)
}

export async function reorder(req: Request, res: Response): Promise<void> {
  const { items } = parse(reorderClientsSchema, req.body)
  await reorderClients(items)
  await recordAudit({
    actorId: req.user?.id,
    action: 'client.reorder',
    meta: { count: items.length },
  })
  res.json({ data: items, meta: { total: items.length } })
}
