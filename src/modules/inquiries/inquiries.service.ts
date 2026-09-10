import { Prisma, type Inquiry, type InquiryStatus } from '@prisma/client'

import { prisma } from '../../db/prisma'
import { ApiError } from '../../shared/ApiError'
import { buildMeta, toSkipTake, type ListMeta, type PageParams } from '../_shared/pagination'
import type { CreateInquiryInput, ListInquiriesQuery } from './inquiries.schemas'

export function serializeInquiry(i: Inquiry) {
  return {
    id: i.id,
    name: i.name,
    email: i.email,
    company: i.company ?? null,
    service: i.service ?? null,
    budget: i.budget ?? null,
    message: i.message,
    status: i.status,
    source: i.source,
    createdAt: i.createdAt,
    updatedAt: i.updatedAt,
  }
}

export async function createInquiry(
  input: CreateInquiryInput,
  ctx: { ip?: string; userAgent?: string },
) {
  const row = await prisma.inquiry.create({
    data: {
      name: input.name,
      email: input.email,
      company: input.company ?? null,
      service: input.service ?? null,
      budget: input.budget ?? null,
      message: input.message,
      ip: ctx.ip ?? null,
      userAgent: ctx.userAgent ?? null,
    },
  })
  return serializeInquiry(row)
}

export async function listInquiries(
  query: ListInquiriesQuery,
): Promise<{ data: ReturnType<typeof serializeInquiry>[]; meta: ListMeta; unread: number }> {
  const params: PageParams = { page: query.page, pageSize: query.pageSize }
  const where: Prisma.InquiryWhereInput = {}
  if (query.status) where.status = query.status
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { email: { contains: query.q, mode: 'insensitive' } },
      { company: { contains: query.q, mode: 'insensitive' } },
      { message: { contains: query.q, mode: 'insensitive' } },
    ]
  }

  const [rows, total, unread] = await Promise.all([
    prisma.inquiry.findMany({ where, orderBy: { createdAt: 'desc' }, ...toSkipTake(params) }),
    prisma.inquiry.count({ where }),
    prisma.inquiry.count({ where: { status: 'new' } }),
  ])
  return { data: rows.map(serializeInquiry), meta: buildMeta(params, total), unread }
}

export async function getInquiry(id: string) {
  const row = await prisma.inquiry.findUnique({ where: { id } })
  if (!row) throw ApiError.notFound('Inquiry not found')
  return serializeInquiry(row)
}

export async function setInquiryStatus(id: string, status: InquiryStatus) {
  try {
    const row = await prisma.inquiry.update({ where: { id }, data: { status } })
    return serializeInquiry(row)
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Inquiry not found')
    }
    throw err
  }
}

export async function deleteInquiry(id: string): Promise<void> {
  try {
    await prisma.inquiry.delete({ where: { id } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw ApiError.notFound('Inquiry not found')
    }
    throw err
  }
}
