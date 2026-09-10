import { z } from 'zod'

import { pageQuerySchema } from '../_shared/pagination'

/** Icon preset keys the frontend roadmap knows how to render. */
export const PROCESS_ICONS = ['search', 'strategy', 'design', 'build', 'launch', 'support'] as const

const shape = {
  step: z.string().trim().min(1).max(8),
  title: z.string().trim().min(1).max(60),
  description: z.string().trim().min(1).max(300),
  icon: z.enum(PROCESS_ICONS).default('search'),
  visibility: z.enum(['draft', 'published']).default('draft'),
  sortOrder: z.coerce.number().int().default(0),
}

export const createProcessStepSchema = z.object(shape)

export const updateProcessStepSchema = z
  .object(shape)
  .partial()
  .refine(v => Object.keys(v).length > 0, { message: 'Provide at least one field to update' })

export const listProcessStepsQuerySchema = pageQuerySchema.extend({
  visibility: z.enum(['draft', 'published']).optional(),
})

export const reorderProcessStepsSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1), sortOrder: z.coerce.number().int() }))
    .min(1)
    .max(200),
})

export type CreateProcessStepInput = z.infer<typeof createProcessStepSchema>
export type UpdateProcessStepInput = z.infer<typeof updateProcessStepSchema>
export type ListProcessStepsQuery = z.infer<typeof listProcessStepsQuerySchema>
