import { z } from 'zod'

import { pageQuerySchema } from '../_shared/pagination'
import { DELIVERY_STATUSES, METRIC_TRENDS, SOCIAL_PLATFORMS } from './projects.meta'

const CURRENT_YEAR = new Date().getFullYear()
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

// ---------------------------------------------------------------------------
// Field shapes
// ---------------------------------------------------------------------------

const commonShape = {
  title: z.string().trim().min(2).max(120),
  client: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(200),
  coverImageUrl: z.url(),
  year: z.coerce.number().int().min(2000).max(CURRENT_YEAR + 1),
  tags: z.array(z.string().trim().min(1).max(24)).max(12).default([]),
  featured: z.boolean().default(false),
  visibility: z.enum(['draft', 'published']).default('draft'),
  sortOrder: z.coerce.number().int().default(0),
  slug: z.string().trim().regex(SLUG_RE, 'Slug must be kebab-case').max(80).optional(),
}

const metricSchema = z.object({
  label: z.string().trim().min(1).max(24),
  value: z.string().trim().min(1).max(12),
  trend: z.enum(METRIC_TRENDS).default('up'),
})

const socialShape = {
  platform: z.enum(SOCIAL_PLATFORMS),
  handle: z.string().trim().min(1).max(60),
  campaignType: z.string().trim().min(1).max(60),
  metrics: z.array(metricSchema).min(1).max(6),
  campaignUrl: z.url().nullish(),
}

const softwareShape = {
  projectType: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(400),
  stack: z.array(z.string().trim().min(1).max(24)).min(1).max(12),
  deliveryStatus: z.enum(DELIVERY_STATUSES),
  liveUrl: z.url().nullish(),
  caseStudyUrl: z.url().nullish(),
  repoUrl: z.url().nullish(),
}

// ---------------------------------------------------------------------------
// Create (discriminated by kind)
// ---------------------------------------------------------------------------

export const socialCreateSchema = z.object({
  kind: z.literal('social'),
  ...commonShape,
  ...socialShape,
})

export const softwareCreateSchema = z.object({
  kind: z.literal('software'),
  ...commonShape,
  ...softwareShape,
})

export const createProjectSchema = z.discriminatedUnion('kind', [
  socialCreateSchema,
  softwareCreateSchema,
])

// ---------------------------------------------------------------------------
// Update (partial, kind fixed by the stored row)
// ---------------------------------------------------------------------------

export const socialUpdateSchema = z.object({ ...commonShape, ...socialShape }).partial()
export const softwareUpdateSchema = z.object({ ...commonShape, ...softwareShape }).partial()

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

const baseListQuery = pageQuerySchema.extend({
  kind: z.enum(['social', 'software']).optional(),
  featured: z.enum(['true', 'false']).optional(),
  tag: z.string().trim().min(1).optional(),
  q: z.string().trim().min(1).optional(),
  sort: z.enum(['sortOrder', '-year', '-createdAt']).default('sortOrder'),
})

export const publicListQuerySchema = baseListQuery
export const adminListQuerySchema = baseListQuery.extend({
  visibility: z.enum(['draft', 'published']).optional(),
})

export const reorderSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1), sortOrder: z.coerce.number().int() }))
    .min(1)
    .max(500),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type PublicListQuery = z.infer<typeof publicListQuerySchema>
export type AdminListQuery = z.infer<typeof adminListQuerySchema>
export type Metric = z.infer<typeof metricSchema>
