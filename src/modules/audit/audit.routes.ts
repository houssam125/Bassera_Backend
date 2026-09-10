import { Router } from 'express'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

import { prisma } from '../../db/prisma'
import { asyncHandler } from '../_shared/asyncHandler'
import { requireMinRole } from '../_shared/auth.middleware'
import { buildMeta, pageQuerySchema, toSkipTake } from '../_shared/pagination'
import { parse } from '../_shared/validate'

const querySchema = pageQuerySchema.extend({
  actorId: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
})

const router = Router()

router.get(
  '/',
  requireMinRole('admin'),
  asyncHandler(async (req, res) => {
    const q = parse(querySchema, req.query)
    const where: Prisma.AuditLogWhereInput = {}
    if (q.actorId) where.actorId = q.actorId
    if (q.action) where.action = q.action
    if (q.from || q.to) {
      where.createdAt = {
        ...(q.from ? { gte: q.from } : {}),
        ...(q.to ? { lte: q.to } : {}),
      }
    }

    const params = { page: q.page, pageSize: q.pageSize }
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        ...toSkipTake(params),
      }),
      prisma.auditLog.count({ where }),
    ])
    res.json({ data, meta: buildMeta(params, total) })
  }),
)

export default router
