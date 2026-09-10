import { z } from 'zod'

/** Editable homepage copy. All fields optional on PATCH; `null` clears a URL. */
export const updateSiteSchema = z
  .object({
    heroEyebrow: z.string().trim().min(1).max(120),
    heroTitleLead: z.string().trim().min(1).max(120),
    heroTitleHighlight: z.string().trim().min(1).max(120),
    heroTitleTail: z.string().trim().max(120),
    heroSubtext: z.string().trim().min(1).max(400),
    heroPrimaryCtaLabel: z.string().trim().min(1).max(40),
    heroSecondaryCtaLabel: z.string().trim().min(1).max(40),
    contactLocation: z.string().trim().min(1).max(120),
    contactEmail: z.string().trim().min(1).max(160),
    contactPhone: z.string().trim().min(1).max(60),
    facebookUrl: z.url().nullish(),
    instagramUrl: z.url().nullish(),
  })
  .partial()
  .refine(v => Object.keys(v).length > 0, { message: 'Provide at least one field to update' })

export type UpdateSiteInput = z.infer<typeof updateSiteSchema>
