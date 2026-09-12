import { Prisma, type Project } from '@prisma/client'

import { prisma } from '../../db/prisma'
import { ApiError } from '../../shared/ApiError'
import { buildMeta, toSkipTake, type ListMeta, type PageParams } from '../_shared/pagination'
import { uniqueProjectSlug } from '../_shared/slug'
import type {
  AdminListQuery,
  CreateProjectInput,
  Metric,
  PublicListQuery,
} from './projects.schemas'

const CUID_RE = /^c[a-z0-9]{20,}$/i

// ---------------------------------------------------------------------------
// Serialization — return a clean discriminated object per `kind`
// ---------------------------------------------------------------------------

export function serializeProject(p: Project): Record<string, unknown> {
  const common = {
    id: p.id,
    kind: p.kind,
    slug: p.slug,
    title: p.title,
    client: p.client,
    summary: p.summary,
    coverImageUrl: p.coverImageUrl,
    year: p.year,
    tags: p.tags,
    featured: p.featured,
    visibility: p.visibility,
    sortOrder: p.sortOrder,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }

  if (p.kind === 'social') {
    return {
      ...common,
      platform: p.platform,
      handle: p.handle,
      campaignType: p.campaignType,
      metrics: (p.metrics ?? []) as Metric[],
      campaignUrl: p.campaignUrl ?? null,
    }
  }

  return {
    ...common,
    projectType: p.projectType,
    description: p.description,
    stack: p.stack,
    deliveryStatus: p.deliveryStatus,
    liveUrl: p.liveUrl ?? null,
    caseStudyUrl: p.caseStudyUrl ?? null,
    repoUrl: p.repoUrl ?? null,
  }
}

// ---------------------------------------------------------------------------
// Listing
// ---------------------------------------------------------------------------

function orderFor(sort: PublicListQuery['sort']): Prisma.ProjectOrderByWithRelationInput[] {
  // `id` is always the last tiebreaker: without one, rows tied on the other
  // columns (e.g. several seeded/published in the same request) can shift
  // across pages between requests and show up twice, or get skipped.
  switch (sort) {
    case '-year':
      return [{ year: 'desc' }, { sortOrder: 'asc' }, { id: 'desc' }]
    case '-createdAt':
      return [{ createdAt: 'desc' }, { id: 'desc' }]
    case 'sortOrder':
    default:
      return [{ sortOrder: 'asc' }, { createdAt: 'desc' }, { id: 'desc' }]
  }
}

function whereFor(
  query: AdminListQuery,
  opts: { forcePublished: boolean },
): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {}

  if (query.kind) where.kind = query.kind
  if (opts.forcePublished) where.visibility = 'published'
  else if (query.visibility) where.visibility = query.visibility
  if (query.featured === 'true') where.featured = true
  if (query.featured === 'false') where.featured = false
  if (query.tag) where.tags = { has: query.tag }
  if (query.q) {
    where.OR = [
      { title: { contains: query.q, mode: 'insensitive' } },
      { client: { contains: query.q, mode: 'insensitive' } },
      { summary: { contains: query.q, mode: 'insensitive' } },
    ]
  }

  return where
}

export async function listProjects(
  query: AdminListQuery,
  opts: { forcePublished: boolean },
): Promise<{ data: Record<string, unknown>[]; meta: ListMeta }> {
  const params: PageParams = { page: query.page, pageSize: query.pageSize }
  const where = whereFor(query, opts)
  const [rows, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: orderFor(query.sort),
      ...toSkipTake(params),
    }),
    prisma.project.count({ where }),
  ])
  return { data: rows.map(serializeProject), meta: buildMeta(params, total) }
}

export async function getProject(
  idOrSlug: string,
  opts: { forcePublished: boolean },
): Promise<Record<string, unknown>> {
  const byId = CUID_RE.test(idOrSlug)
  const project = await prisma.project.findFirst({
    where: {
      ...(byId ? { OR: [{ id: idOrSlug }, { slug: idOrSlug }] } : { slug: idOrSlug }),
      ...(opts.forcePublished ? { visibility: 'published' } : {}),
    },
  })
  if (!project) throw ApiError.notFound('Project not found')
  return serializeProject(project)
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

async function resolveSlugForCreate(title: string, requested?: string): Promise<string> {
  if (!requested) return uniqueProjectSlug(title)
  const clash = await prisma.project.findUnique({ where: { slug: requested }, select: { id: true } })
  if (clash) throw new ApiError(409, `Slug "${requested}" is already in use`)
  return requested
}

export async function createProject(
  input: CreateProjectInput,
): Promise<Record<string, unknown>> {
  const slug = await resolveSlugForCreate(input.title, input.slug)

  const data: Prisma.ProjectCreateInput = {
    kind: input.kind,
    slug,
    title: input.title,
    client: input.client,
    summary: input.summary,
    coverImageUrl: input.coverImageUrl,
    year: input.year,
    tags: input.tags,
    featured: input.featured,
    visibility: input.visibility,
    sortOrder: input.sortOrder,
  }

  if (input.kind === 'social') {
    data.platform = input.platform
    data.handle = input.handle
    data.campaignType = input.campaignType
    data.metrics = input.metrics as Prisma.InputJsonValue
    data.campaignUrl = input.campaignUrl ?? null
  } else {
    data.projectType = input.projectType
    data.description = input.description
    data.stack = input.stack
    data.deliveryStatus = input.deliveryStatus
    data.liveUrl = input.liveUrl ?? null
    data.caseStudyUrl = input.caseStudyUrl ?? null
    data.repoUrl = input.repoUrl ?? null
  }

  const created = await prisma.project.create({ data })
  return serializeProject(created)
}

/** `patch` is the already-validated partial payload for the row's kind. */
export async function updateProject(
  id: string,
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const existing = await prisma.project.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound('Project not found')

  const data: Prisma.ProjectUpdateInput = {}
  const set = <K extends keyof Prisma.ProjectUpdateInput>(key: K, value: Prisma.ProjectUpdateInput[K]) => {
    data[key] = value
  }

  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue
    if (key === 'slug') {
      if (value !== existing.slug) {
        const clash = await prisma.project.findFirst({
          where: { slug: value as string, NOT: { id } },
          select: { id: true },
        })
        if (clash) throw new ApiError(409, `Slug "${value}" is already in use`)
      }
      set('slug', value as string)
    } else if (key === 'metrics') {
      set('metrics', value as Prisma.InputJsonValue)
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      set(key as keyof Prisma.ProjectUpdateInput, value as any)
    }
  }

  const updated = await prisma.project.update({ where: { id }, data })
  return serializeProject(updated)
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await prisma.project.delete({ where: { id } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Project not found')
    }
    throw err
  }
}

export async function setVisibility(
  id: string,
  visibility: 'draft' | 'published',
): Promise<Record<string, unknown>> {
  try {
    const updated = await prisma.project.update({ where: { id }, data: { visibility } })
    return serializeProject(updated)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Project not found')
    }
    throw err
  }
}

export async function reorderProjects(items: { id: string; sortOrder: number }[]): Promise<void> {
  try {
    await prisma.$transaction(
      items.map(item =>
        prisma.project.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } }),
      ),
    )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('One or more projects were not found')
    }
    throw err
  }
}
