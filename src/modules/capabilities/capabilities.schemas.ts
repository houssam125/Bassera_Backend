import { z } from 'zod'

import { pageQuerySchema } from '../_shared/pagination'
import { CAPABILITY_ICONS } from './capabilities.meta'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const shape = {
  division: z.enum(['social', 'software']),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().min(1).max(280),
  tags: z.array(z.string().trim().min(1).max(24)).max(8).default([]),
  icon: z.enum(CAPABILITY_ICONS),
  visibility: z.enum(['draft', 'published']).default('draft'),
  sortOrder: z.coerce.number().int().default(0),
  slug: z.string().trim().regex(SLUG_RE, 'Slug must be kebab-case').max(90).optional(),
}

export const createCapabilitySchema = z.object(shape)

/** Partial for PATCH; `division` stays editable (unlike Project.kind). */
export const updateCapabilitySchema = z.object(shape).partial().refine(
  v => Object.keys(v).length > 0,
  { message: 'Provide at least one field to update' },
)

export const listCapabilitiesQuerySchema = pageQuerySchema.extend({
  division: z.enum(['social', 'software']).optional(),
  visibility: z.enum(['draft', 'published']).optional(),
  q: z.string().trim().min(1).optional(),
})

export const reorderCapabilitiesSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1), sortOrder: z.coerce.number().int() }))
    .min(1)
    .max(200),
})

export type CreateCapabilityInput = z.infer<typeof createCapabilitySchema>
export type UpdateCapabilityInput = z.infer<typeof updateCapabilitySchema>
export type ListCapabilitiesQuery = z.infer<typeof listCapabilitiesQuerySchema>
