import { z } from 'zod'

import { pageQuerySchema } from '../_shared/pagination'

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const shape = {
  name: z.string().trim().min(1).max(80),
  logoUrl: z.url(),
  websiteUrl: z.url().nullish(),
  visibility: z.enum(['draft', 'published']).default('draft'),
  sortOrder: z.coerce.number().int().default(0),
  slug: z.string().trim().regex(SLUG_RE, 'Slug must be kebab-case').max(90).optional(),
}

export const createClientSchema = z.object(shape)

export const updateClientSchema = z
  .object(shape)
  .partial()
  .refine(v => Object.keys(v).length > 0, { message: 'Provide at least one field to update' })

export const listClientsQuerySchema = pageQuerySchema.extend({
  visibility: z.enum(['draft', 'published']).optional(),
  q: z.string().trim().min(1).optional(),
})

export const reorderClientsSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1), sortOrder: z.coerce.number().int() }))
    .min(1)
    .max(200),
})

export type CreateClientInput = z.infer<typeof createClientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>
