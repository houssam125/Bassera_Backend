import { z } from 'zod'

import { pageQuerySchema } from '../_shared/pagination'

const shape = {
  quote: z.string().trim().min(1).max(600),
  authorName: z.string().trim().min(1).max(80),
  authorTitle: z.string().trim().max(120).nullish(),
  company: z.string().trim().max(80).nullish(),
  avatarUrl: z.url().nullish(),
  visibility: z.enum(['draft', 'published']).default('draft'),
  sortOrder: z.coerce.number().int().default(0),
}

export const createTestimonialSchema = z.object(shape)

export const updateTestimonialSchema = z
  .object(shape)
  .partial()
  .refine(v => Object.keys(v).length > 0, { message: 'Provide at least one field to update' })

export const listTestimonialsQuerySchema = pageQuerySchema.extend({
  visibility: z.enum(['draft', 'published']).optional(),
  q: z.string().trim().min(1).optional(),
})

export const reorderTestimonialsSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1), sortOrder: z.coerce.number().int() }))
    .min(1)
    .max(200),
})

export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>
export type ListTestimonialsQuery = z.infer<typeof listTestimonialsQuerySchema>
