import type { Prisma, SiteContent } from '@prisma/client'

import { prisma } from '../../db/prisma'
import type { UpdateSiteInput } from './site.schemas'

/** The homepage-content row is a singleton keyed by this id. */
const ID = 'singleton'

export function serializeSite(s: SiteContent) {
  return {
    heroEyebrow: s.heroEyebrow,
    heroTitleLead: s.heroTitleLead,
    heroTitleHighlight: s.heroTitleHighlight,
    heroTitleTail: s.heroTitleTail,
    heroSubtext: s.heroSubtext,
    heroPrimaryCtaLabel: s.heroPrimaryCtaLabel,
    heroSecondaryCtaLabel: s.heroSecondaryCtaLabel,
    contactLocation: s.contactLocation,
    contactEmail: s.contactEmail,
    contactPhone: s.contactPhone,
    facebookUrl: s.facebookUrl ?? null,
    instagramUrl: s.instagramUrl ?? null,
    updatedAt: s.updatedAt,
  }
}

/** Reads the row, creating it with schema defaults on first access. */
export async function getSiteContent() {
  const row = await prisma.siteContent.upsert({
    where: { id: ID },
    update: {},
    create: { id: ID },
  })
  return serializeSite(row)
}

export async function updateSiteContent(patch: UpdateSiteInput) {
  const data: Prisma.SiteContentUpdateInput = {}
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      // null is a valid value for the nullable URL columns
      ;(data as Record<string, unknown>)[key] = value
    }
  }
  const row = await prisma.siteContent.upsert({
    where: { id: ID },
    update: data,
    create: { ...(data as Prisma.SiteContentCreateInput), id: ID },
  })
  return serializeSite(row)
}
