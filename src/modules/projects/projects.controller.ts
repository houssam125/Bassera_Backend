import type { Request, Response } from 'express'

import { recordAudit } from '../_shared/audit'
import { parse } from '../_shared/validate'
import { prisma } from '../../db/prisma'
import { ApiError } from '../../shared/ApiError'
import { PROJECT_META } from './projects.meta'
import {
  adminListQuerySchema,
  createProjectSchema,
  publicListQuerySchema,
  reorderSchema,
  socialUpdateSchema,
  softwareUpdateSchema,
} from './projects.schemas'
import {
  createProject,
  deleteProject,
  getProject,
  listProjects,
  reorderProjects,
  setVisibility,
  updateProject,
} from './projects.service'

// --- public ---------------------------------------------------------------

export async function getMeta(_req: Request, res: Response): Promise<void> {
  res.json(PROJECT_META)
}

export async function listPublic(req: Request, res: Response): Promise<void> {
  const query = parse(publicListQuerySchema, req.query)
  const result = await listProjects(query, { forcePublished: true })
  res.json(result)
}

export async function getPublic(req: Request, res: Response): Promise<void> {
  const project = await getProject(req.params.idOrSlug, { forcePublished: true })
  res.json(project)
}

// --- admin --------------------------------------------------------------------

export async function listAdmin(req: Request, res: Response): Promise<void> {
  const query = parse(adminListQuerySchema, req.query)
  const result = await listProjects(query, { forcePublished: false })
  res.json(result)
}

export async function getAdmin(req: Request, res: Response): Promise<void> {
  const project = await getProject(req.params.id, { forcePublished: false })
  res.json(project)
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = parse(createProjectSchema, req.body)
  const project = await createProject(input)
  await recordAudit({
    actorId: req.user?.id,
    action: 'project.create',
    targetType: 'project',
    targetId: project.id as string,
    meta: { kind: String(project.kind) },
  })
  res.status(201).json(project)
}

export async function update(req: Request, res: Response): Promise<void> {
  const existing = await prisma.project.findUnique({
    where: { id: req.params.id },
    select: { kind: true },
  })
  if (!existing) throw ApiError.notFound('Project not found')

  const schema = existing.kind === 'social' ? socialUpdateSchema : softwareUpdateSchema
  const patch = parse(schema, req.body)
  const project = await updateProject(req.params.id, patch)

  await recordAudit({
    actorId: req.user?.id,
    action: 'project.update',
    targetType: 'project',
    targetId: req.params.id,
    meta: { fields: Object.keys(patch) },
  })
  res.json(project)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteProject(req.params.id)
  await recordAudit({
    actorId: req.user?.id,
    action: 'project.delete',
    targetType: 'project',
    targetId: req.params.id,
  })
  res.status(204).send()
}

export async function publish(req: Request, res: Response): Promise<void> {
  const project = await setVisibility(req.params.id, 'published')
  await recordAudit({
    actorId: req.user?.id,
    action: 'project.publish',
    targetType: 'project',
    targetId: req.params.id,
  })
  res.json(project)
}

export async function unpublish(req: Request, res: Response): Promise<void> {
  const project = await setVisibility(req.params.id, 'draft')
  await recordAudit({
    actorId: req.user?.id,
    action: 'project.unpublish',
    targetType: 'project',
    targetId: req.params.id,
  })
  res.json(project)
}

export async function reorder(req: Request, res: Response): Promise<void> {
  const { items } = parse(reorderSchema, req.body)
  await reorderProjects(items)
  await recordAudit({
    actorId: req.user?.id,
    action: 'project.reorder',
    meta: { count: items.length },
  })
  res.json({ data: items, meta: { total: items.length } })
}
