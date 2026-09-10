import type { Request, Response } from 'express'

import { recordAudit } from '../_shared/audit'
import { parse } from '../_shared/validate'
import {
  createTestimonialSchema,
  listTestimonialsQuerySchema,
  reorderTestimonialsSchema,
  updateTestimonialSchema,
} from './testimonials.schemas'
import {
  createTestimonial,
  deleteTestimonial,
  getTestimonial,
  listTestimonials,
  reorderTestimonials,
  setTestimonialVisibility,
  updateTestimonial,
} from './testimonials.service'

// --- public ------------------------------------------------------------------

export async function listPublic(req: Request, res: Response): Promise<void> {
  const query = parse(listTestimonialsQuerySchema, req.query)
  res.json(await listTestimonials(query, { forcePublished: true }))
}

// --- admin -----------------------------------------------------------------

export async function listAdmin(req: Request, res: Response): Promise<void> {
  const query = parse(listTestimonialsQuerySchema, req.query)
  res.json(await listTestimonials(query, { forcePublished: false }))
}

export async function getAdmin(req: Request, res: Response): Promise<void> {
  res.json(await getTestimonial(req.params.id, { forcePublished: false }))
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = parse(createTestimonialSchema, req.body)
  const row = await createTestimonial(input)
  await recordAudit({
    actorId: req.user?.id,
    action: 'testimonial.create',
    targetType: 'testimonial',
    targetId: row.id,
    meta: { authorName: row.authorName },
  })
  res.status(201).json(row)
}

export async function update(req: Request, res: Response): Promise<void> {
  const patch = parse(updateTestimonialSchema, req.body)
  const row = await updateTestimonial(req.params.id, patch)
  await recordAudit({
    actorId: req.user?.id,
    action: 'testimonial.update',
    targetType: 'testimonial',
    targetId: req.params.id,
    meta: { fields: Object.keys(patch) },
  })
  res.json(row)
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteTestimonial(req.params.id)
  await recordAudit({
    actorId: req.user?.id,
    action: 'testimonial.delete',
    targetType: 'testimonial',
    targetId: req.params.id,
  })
  res.status(204).send()
}

export async function publish(req: Request, res: Response): Promise<void> {
  const row = await setTestimonialVisibility(req.params.id, 'published')
  await recordAudit({
    actorId: req.user?.id,
    action: 'testimonial.publish',
    targetType: 'testimonial',
    targetId: req.params.id,
  })
  res.json(row)
}

export async function unpublish(req: Request, res: Response): Promise<void> {
  const row = await setTestimonialVisibility(req.params.id, 'draft')
  await recordAudit({
    actorId: req.user?.id,
    action: 'testimonial.unpublish',
    targetType: 'testimonial',
    targetId: req.params.id,
  })
  res.json(row)
}

export async function reorder(req: Request, res: Response): Promise<void> {
  const { items } = parse(reorderTestimonialsSchema, req.body)
  await reorderTestimonials(items)
  await recordAudit({
    actorId: req.user?.id,
    action: 'testimonial.reorder',
    meta: { count: items.length },
  })
  res.json({ data: items, meta: { total: items.length } })
}
