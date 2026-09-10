import { Prisma, type ProcessStep } from '@prisma/client'

import { prisma } from '../../db/prisma'
import { ApiError } from '../../shared/ApiError'
import { buildMeta, toSkipTake, type ListMeta, type PageParams } from '../_shared/pagination'
import type {
  CreateProcessStepInput,
  ListProcessStepsQuery,
  UpdateProcessStepInput,
} from './process.schemas'

export function serializeProcessStep(s: ProcessStep) {
  return {
    id: s.id,
    step: s.step,
    title: s.title,
    description: s.description,
    icon: s.icon,
    visibility: s.visibility,
    sortOrder: s.sortOrder,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }
}

function whereFor(
  query: ListProcessStepsQuery,
  opts: { forcePublished: boolean },
): Prisma.ProcessStepWhereInput {
  const where: Prisma.ProcessStepWhereInput = {}
  if (opts.forcePublished) where.visibility = 'published'
  else if (query.visibility) where.visibility = query.visibility
  return where
}

export async function listProcessSteps(
  query: ListProcessStepsQuery,
  opts: { forcePublished: boolean },
): Promise<{ data: ReturnType<typeof serializeProcessStep>[]; meta: ListMeta }> {
  const params: PageParams = { page: query.page, pageSize: query.pageSize }
  const where = whereFor(query, opts)
  const [rows, total] = await Promise.all([
    prisma.processStep.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      ...toSkipTake(params),
    }),
    prisma.processStep.count({ where }),
  ])
  return { data: rows.map(serializeProcessStep), meta: buildMeta(params, total) }
}

export async function getProcessStep(id: string, opts: { forcePublished: boolean }) {
  const row = await prisma.processStep.findFirst({
    where: { id, ...(opts.forcePublished ? { visibility: 'published' } : {}) },
  })
  if (!row) throw ApiError.notFound('Process step not found')
  return serializeProcessStep(row)
}

export async function createProcessStep(input: CreateProcessStepInput) {
  const row = await prisma.processStep.create({
    data: {
      step: input.step,
      title: input.title,
      description: input.description,
      icon: input.icon,
      visibility: input.visibility,
      sortOrder: input.sortOrder,
    },
  })
  return serializeProcessStep(row)
}

export async function updateProcessStep(id: string, patch: UpdateProcessStepInput) {
  const existing = await prisma.processStep.findUnique({ where: { id } })
  if (!existing) throw ApiError.notFound('Process step not found')

  const data: Prisma.ProcessStepUpdateInput = {}
  if (patch.step !== undefined) data.step = patch.step
  if (patch.title !== undefined) data.title = patch.title
  if (patch.description !== undefined) data.description = patch.description
  if (patch.icon !== undefined) data.icon = patch.icon
  if (patch.visibility !== undefined) data.visibility = patch.visibility
  if (patch.sortOrder !== undefined) data.sortOrder = patch.sortOrder

  const row = await prisma.processStep.update({ where: { id }, data })
  return serializeProcessStep(row)
}

export async function deleteProcessStep(id: string): Promise<void> {
  try {
    await prisma.processStep.delete({ where: { id } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Process step not found')
    }
    throw err
  }
}

export async function setProcessStepVisibility(id: string, visibility: 'draft' | 'published') {
  try {
    const row = await prisma.processStep.update({ where: { id }, data: { visibility } })
    return serializeProcessStep(row)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Process step not found')
    }
    throw err
  }
}

export async function reorderProcessSteps(
  items: { id: string; sortOrder: number }[],
): Promise<void> {
  try {
    await prisma.$transaction(
      items.map(i =>
        prisma.processStep.update({ where: { id: i.id }, data: { sortOrder: i.sortOrder } }),
      ),
    )
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('One or more process steps were not found')
    }
    throw err
  }
}
