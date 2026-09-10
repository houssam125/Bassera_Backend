import { Prisma, type Capability } from '@prisma/client'

import { prisma } from '../../db/prisma'
import { ApiError } from '../../shared/ApiError'
import { buildMeta, toSkipTake, type ListMeta, type PageParams } from '../_shared/pagination'
import { slugify } from '../_shared/slug'
import type {
  CreateCapabilityInput,
  ListCapabilitiesQuery,
  UpdateCapabilityInput,
} from './capabilities.schemas'

const CUID_RE = /^c[a-z0-9]{20,}$/i

export function serializeCapability(c: Capability) {
  return {
    id: c.id,
    division: c.division,
    slug: c.slug,
    name: c.name,
    description: c.description,
    tags: c.tags,
    icon: c.icon,
    visibility: c.visibility,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

async function uniqueSlug(name: string, ignoreId?: string): Promise<string> {
  const root = slugify(name) || 'capability'
  let candidate = root
  let n = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await prisma.capability.findFirst({
      where: { slug: candidate, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) },
      select: { id: true },
    })
    if (!clash) return candidate
    n += 1
    candidate = `${root}-${n}`
  }
}

function whereFor(
  query: ListCapabilitiesQuery,
  opts: { forcePublished: boolean },
): Prisma.CapabilityWhereInput {
  const where: Prisma.CapabilityWhereInput = {}
  if (query.division) where.division = query.division
  if (opts.forcePublished) where.visibility = 'published'
  else if (query.visibility) where.visibility = query.visibility
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
    ]
  }
  return where
}

export async function listCapabilities(
  query: ListCapabilitiesQuery,
  opts: { forcePublished: boolean },
): Promise<{ data: ReturnType<typeof serializeCapability>[]; meta: ListMeta }> {
  const params: PageParams = { page: query.page, pageSize: query.pageSize }
  const where = whereFor(query, opts)
  const [rows, total] = await Promise.all([
    prisma.capability.findMany({
      where,
      orderBy: [{ division: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
      ...toSkipTake(params),
    }),
    prisma.capability.count({ where }),
  ])
  return { data: rows.map(serializeCapability), meta: buildMeta(params, total) }
}

export async function getCapability(
  idOrSlug: string,
  opts: { forcePublished: boolean },
) {
  const byId = CUID_RE.test(idOrSlug)
  const row = await prisma.capability.findFirst({
    where: {
      ...(byId ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug }),
      ...(opts.forcePublished ? { visibility: 'published' } : {}),
    },
  })
  if (!row) throw ApiError.notFound('Capability not found')
  return serializeCapability(row)
}

export async function createCapability(input: CreateCapabilityInput) {
  let slug: string
  if (input.slug) {
    const requested = input.slug
    const clash = await prisma.capability.findUnique({
      where: { slug: requested },
      select: { id: true },
    })
    if (clash) throw new ApiError(409, `Slug "${requested}" is already in use`)
    slug = requested
  } else {
    slug = await uniqueSlug(input.name)
  }

  const row = await prisma.capability.create({
    data: {
      division: input.division,
      slug,
      name: input.name,
      description: input.description,
      tags: input.tags,
      icon: input.icon,
      visibility: input.visibility,
      sortOrder: input.sortOrder,
    },
  })
  return serializeCapability(row)
}

export async function updateCapability(id: string, patch: UpdateCapabilityInput) {
  const existing = await prisma.capability.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound('Capability not found')

  const data: Prisma.CapabilityUpdateInput = {}
  if (patch.division !== undefined) data.division = patch.division
  if (patch.name !== undefined) data.name = patch.name
  if (patch.description !== undefined) data.description = patch.description
  if (patch.tags !== undefined) data.tags = patch.tags
  if (patch.icon !== undefined) data.icon = patch.icon
  if (patch.visibility !== undefined) data.visibility = patch.visibility
  if (patch.sortOrder !== undefined) data.sortOrder = patch.sortOrder
  if (patch.slug !== undefined && patch.slug !== existing.slug) {
    const clash = await prisma.capability.findFirst({
      where: { slug: patch.slug, NOT: { id } },
      select: { id: true },
    })
    if (clash) throw new ApiError(409, `Slug "${patch.slug}" is already in use`)
    data.slug = patch.slug
  }

  const row = await prisma.capability.update({ where: { id }, data })
  return serializeCapability(row)
}

export async function deleteCapability(id: string): Promise<void> {
  try {
    await prisma.capability.delete({ where: { id } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Capability not found')
    }
    throw err
  }
}

export async function setCapabilityVisibility(id: string, visibility: 'draft' | 'published') {
  try {
    const row = await prisma.capability.update({ where: { id }, data: { visibility } })
    return serializeCapability(row)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Capability not found')
    }
    throw err
  }
}

export async function reorderCapabilities(
  items: { id: string; sortOrder: number }[],
): Promise<void> {
  try {
    await prisma.$transaction(
      items.map(i =>
        prisma.capability.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } }),
      ),
    )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('One or more capabilities were not found')
    }
    throw err
  }
}
