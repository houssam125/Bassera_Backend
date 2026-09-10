import { z } from 'zod'

import { pageQuerySchema } from '../_shared/pagination'

const email = z.preprocess(
  v => (typeof v === 'string' ? v.trim().toLowerCase() : v),
  z.email('Invalid email address'),
)

/** Public — the contact form payload. Mirrors the fields on Contact.tsx. */
export const createInquirySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(120),
  email,
  company: z.string().trim().max(120).optional(),
  service: z.string().trim().max(60).optional(),
  budget: z.string().trim().max(60).optional(),
  message: z
    .string()
    .trim()
    .min(20, 'Please provide at least 20 characters of detail')
    .max(4000),
  // Honeypot — real users never fill this; bots do. Accepted but the
  // controller silently drops the submission (202) when it's non-empty.
  website: z.string().max(200).optional(),
})

export const listInquiriesQuerySchema = pageQuerySchema.extend({
  status: z.enum(['new', 'read', 'replied', 'archived']).optional(),
  q: z.string().trim().min(1).optional(),
})

export const updateInquirySchema = z.object({
  status: z.enum(['new', 'read', 'replied', 'archived']),
})

export type CreateInquiryInput = z.infer<typeof createInquirySchema>
export type ListInquiriesQuery = z.infer<typeof listInquiriesQuerySchema>
