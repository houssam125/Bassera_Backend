import { z } from 'zod'

/** `?page` / `?pageSize` query schema shared by every list endpoint. */
export const pageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export interface PageParams {
  page: number
  pageSize: number
}

export function toSkipTake({ page, pageSize }: PageParams): { skip: number; take: number } {
  return { skip: (page - 1) * pageSize, take: pageSize }
}

export interface ListMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function buildMeta({ page, pageSize }: PageParams, total: number): ListMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) }
}

export function listEnvelope<T>(items: T[], params: PageParams, total: number): {
  data: T[]
  meta: ListMeta
} {
  return { data: items, meta: buildMeta(params, total) }
}
