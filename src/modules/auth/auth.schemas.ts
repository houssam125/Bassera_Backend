import { z } from 'zod'

import { profileFieldsShape } from '../_shared/profile'
import { isCommonPassword } from './commonPasswords'

/** Trimmed + lower-cased email. */
const emailField = z.preprocess(
  value => (typeof value === 'string' ? value.trim().toLowerCase() : value),
  z.email('Invalid email address'),
)

const password = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine(value => !isCommonPassword(value), 'This password is too common')

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: emailField,
  password,
  requestedRole: z.enum(['editor', 'viewer']).default('editor'),
})

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Password is required'),
})

/** `PATCH /api/auth/me` — a user editing their own profile. */
export const updateMeSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    ...profileFieldsShape,
  })
  .partial()
  .refine(v => Object.keys(v).length > 0, { message: 'Provide at least one field to update' })

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type UpdateMeInput = z.infer<typeof updateMeSchema>
