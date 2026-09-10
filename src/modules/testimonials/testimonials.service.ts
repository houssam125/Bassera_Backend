import { Prisma, type Testimonial } from '@prisma/client'

import { prisma } from '../../db/prisma'
import { ApiError } from '../../shared/ApiError'
import { buildMeta, toSkipTake, type ListMeta, type PageParams } from '../_shared/pagination'
import type {
  CreateTestimonialInput,
  ListTestimonialsQuery,
  UpdateTestimonialInput,
} from './testimonials.schemas'

export function serializeTestimonial(t: Testimonial) {
  return {
    id: t.id,
    quote: t.quote,
    authorName: t.authorName,
    authorTitle: t.authorTitle ?? null,
    company: t.company ?? null,
    avatarUrl: t.avatarUrl ?? null,
    visibility: t.visibility,
    sortOrder: t.sortOrder,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }
}

function whereFor(
  query: ListTestimonialsQuery,
  opts: { forcePublished: boolean },
): Prisma.TestimonialWhereInput {
  const where: Prisma.TestimonialWhereInput = {}
  if (opts.forcePublished) where.visibility = 'published'
  else if (query.visibility) where.visibility = query.visibility
  if (query.q) {
    where.OR = [
      { authorName: { contains: query.q, mode: 'insensitive' } },
      { company: { contains: query.q, mode: 'insensitive' } },
      { quote: { contains: query.q, mode: 'insensitive' } },
    ]
  }
  return where
}

export async function listTestimonials(
  query: ListTestimonialsQuery,
  opts: { forcePublished: boolean },
): Promise<{ data: ReturnType<typeof serializeTestimonial>[]; meta: ListMeta }> {
  const params: PageParams = { page: query.page, pageSize: query.pageSize }
  const where = whereFor(query, opts)
  const [rows, total] = await Promise.all([
    prisma.testimonial.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      ...toSkipTake(params),
    }),
    prisma.testimonial.count({ where }),
  ])
  return { data: rows.map(serializeTestimonial), meta: buildMeta(params, total) }
}

export async function getTestimonial(id: string, opts: { forcePublished: boolean }) {
  const row = await prisma.testimonial.findFirst({
    where: { id, ...(opts.forcePublished ? { visibility: 'published' } : {}) },
  })
  if (!row) throw ApiError.notFound('Testimonial not found')
  return serializeTestimonial(row)
}

export async function createTestimonial(input: CreateTestimonialInput) {
  const row = await prisma.testimonial.create({
    data: {
      quote: input.quote,
      authorName: input.authorName,
      authorTitle: input.authorTitle ?? null,
      company: input.company ?? null,
      avatarUrl: input.avatarUrl ?? null,
      visibility: input.visibility,
      sortOrder: input.sortOrder,
    },
  })
  return serializeTestimonial(row)
}

export async function updateTestimonial(id: string, patch: UpdateTestimonialInput) {
  const existing = await prisma.testimonial.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound('Testimonial not found')

  const data: Prisma.TestimonialUpdateInput = {}
  if (patch.quote !== undefined) data.quote = patch.quote
  if (patch.authorName !== undefined) data.authorName = patch.authorName
  if (patch.authorTitle !== undefined) data.authorTitle = patch.authorTitle ?? null
  if (patch.company !== undefined) data.company = patch.company ?? null
  if (patch.avatarUrl !== undefined) data.avatarUrl = patch.avatarUrl ?? null
  if (patch.visibility !== undefined) data.visibility = patch.visibility
  if (patch.sortOrder !== undefined) data.sortOrder = patch.sortOrder

  const row = await prisma.testimonial.update({ where: { id }, data })
  return serializeTestimonial(row)
}

export async function deleteTestimonial(id: string): Promise<void> {
  try {
    await prisma.testimonial.delete({ where: { id } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Testimonial not found')
    }
    throw err
  }
}

export async function setTestimonialVisibility(id: string, visibility: 'draft' | 'published') {
  try {
    const row = await prisma.testimonial.update({ where: { id }, data: { visibility } })
    return serializeTestimonial(row)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Testimonial not found')
    }
    throw err
  }
}

export async function reorderTestimonials(
  items: { id: string; sortOrder: number }[],
): Promise<void> {
  try {
    await prisma.$transaction(
      items.map(i =>
        prisma.testimonial.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } }),
      ),
    )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('One or more testimonials were not found')
    }
    throw err
  }
}
