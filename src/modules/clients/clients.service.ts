import { Prisma, type Client } from '@prisma/client'

import { prisma } from '../../db/prisma'
import { ApiError } from '../../shared/ApiError'
import { buildMeta, toSkipTake, type ListMeta, type PageParams } from '../_shared/pagination'
import { slugify } from '../_shared/slug'
import type { CreateClientInput, ListClientsQuery, UpdateClientInput } from './clients.schemas'

const CUID_RE = /^c[a-z0-9]{20,}$/i

export function serializeClient(c: Client) {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    logoUrl: c.logoUrl,
    websiteUrl: c.websiteUrl ?? null,
    visibility: c.visibility,
    sortOrder: c.sortOrder,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  }
}

async function uniqueSlug(name: string, ignoreId?: string): Promise<string> {
  const root = slugify(name) || 'client'
  let candidate = root
  let n = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const clash = await prisma.client.findFirst({
      where: { slug: candidate, ...(ignoreId ? { NOT: { id: ignoreId } } : {}) },
      select: { id: true },
    })
    if (!clash) return candidate
    n += 1
    candidate = `${root}-${n}`
  }
}

function whereFor(
  query: ListClientsQuery,
  opts: { forcePublished: boolean },
): Prisma.ClientWhereInput {
  const where: Prisma.ClientWhereInput = {}
  if (opts.forcePublished) where.visibility = 'published'
  else if (query.visibility) where.visibility = query.visibility
  if (query.q) where.name = { contains: query.q, mode: 'insensitive' }
  return where
}

export async function listClients(
  query: ListClientsQuery,
  opts: { forcePublished: boolean },
): Promise<{ data: ReturnType<typeof serializeClient>[]; meta: ListMeta }> {
  const params: PageParams = { page: query.page, pageSize: query.pageSize }
  const where = whereFor(query, opts)
  const [rows, total] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      ...toSkipTake(params),
    }),
    prisma.client.count({ where }),
  ])
  return { data: rows.map(serializeClient), meta: buildMeta(params, total) }
}

export async function getClient(idOrSlug: string, opts: { forcePublished: boolean }) {
  const byId = CUID_RE.test(idOrSlug)
  const row = await prisma.client.findFirst({
    where: {
      ...(byId ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug }),
      ...(opts.forcePublished ? { visibility: 'published' } : {}),
    },
  })
  if (!row) throw ApiError.notFound('Client not found')
  return serializeClient(row)
}

export async function createClient(input: CreateClientInput) {
  let slug: string
  if (input.slug) {
    const requested = input.slug
    const clash = await prisma.client.findUnique({ where: { slug: requested }, select: { id: true } })
    if (clash) throw new ApiError(409, `Slug "${requested}" is already in use`)
    slug = requested
  } else {
    slug = await uniqueSlug(input.name)
  }

  const row = await prisma.client.create({
    data: {
      slug,
      name: input.name,
      logoUrl: input.logoUrl,
      websiteUrl: input.websiteUrl ?? null,
      visibility: input.visibility,
      sortOrder: input.sortOrder,
    },
  })
  return serializeClient(row)
}

export async function updateClient(id: string, patch: UpdateClientInput) {
  const existing = await prisma.client.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound('Client not found')

  const data: Prisma.ClientUpdateInput = {}
  if (patch.name !== undefined) data.name = patch.name
  if (patch.logoUrl !== undefined) data.logoUrl = patch.logoUrl
  if (patch.websiteUrl !== undefined) data.websiteUrl = patch.websiteUrl ?? null
  if (patch.visibility !== undefined) data.visibility = patch.visibility
  if (patch.sortOrder !== undefined) data.sortOrder = patch.sortOrder
  if (patch.slug !== undefined && patch.slug !== existing.slug) {
    const clash = await prisma.client.findFirst({
      where: { slug: patch.slug, NOT: { id } },
      select: { id: true },
    })
    if (clash) throw new ApiError(409, `Slug "${patch.slug}" is already in use`)
    data.slug = patch.slug
  }

  const row = await prisma.client.update({ where: { id }, data })
  return serializeClient(row)
}

export async function deleteClient(id: string): Promise<void> {
  try {
    await prisma.client.delete({ where: { id } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Client not found')
    }
    throw err
  }
}

export async function setClientVisibility(id: string, visibility: 'draft' | 'published') {
  try {
    const row = await prisma.client.update({ where: { id }, data: { visibility } })
    return serializeClient(row)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Client not found')
    }
    throw err
  }
}

export async function reorderClients(items: { id: string; sortOrder: number }[]): Promise<void> {
  try {
    await prisma.$transaction(
      items.map(i => prisma.client.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } })),
    )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('One or more clients were not found')
    }
    throw err
  }
}
