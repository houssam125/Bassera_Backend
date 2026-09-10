import { z } from 'zod'

import { pageQuerySchema } from '../_shared/pagination'
import { profileFieldsShape } from '../_shared/profile'

export const listUsersQuerySchema = pageQuerySchema.extend({
  status: z.enum(['pending', 'active', 'suspended', 'rejected']).optional(),
  role: z.enum(['owner', 'admin', 'editor', 'viewer']).optional(),
  q: z.string().trim().min(1).optional(),
})

export const approveSchema = z.object({
  role: z.enum(['editor', 'viewer', 'admin']),
})

export const rejectSchema = z.object({
  reason: z.string().trim().max(500).optional(),
})

export const suspendSchema = z.object({
  reason: z.string().trim().max(500).optional(),
})

export const updateUserSchema = z
  .object({
    role: z.enum(['owner', 'admin', 'editor', 'viewer']),
    name: z.string().trim().min(2).max(80),
    teamOrder: z.coerce.number().int(),
    ...profileFieldsShape,
  })
  .partial()
  .refine(v => Object.keys(v).length > 0, {
    message: 'Provide at least one field to update',
  })

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
