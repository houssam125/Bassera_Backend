import type { Prisma } from '@prisma/client'

import { prisma } from '../../db/prisma'

export type AuditAction =
  | 'user.register'
  | 'user.approve'
  | 'user.reject'
  | 'user.suspend'
  | 'user.reactivate'
  | 'user.role_change'
  | 'user.delete'
  | 'project.create'
  | 'project.update'
  | 'project.delete'
  | 'project.publish'
  | 'project.unpublish'
  | 'project.reorder'
  | 'capability.create'
  | 'capability.update'
  | 'capability.delete'
  | 'capability.publish'
  | 'capability.unpublish'
  | 'capability.reorder'
  | 'client.create'
  | 'client.update'
  | 'client.delete'
  | 'client.publish'
  | 'client.unpublish'
  | 'client.reorder'
  | 'inquiry.create'
  | 'inquiry.update'
  | 'inquiry.delete'
  | 'site.update'
  | 'testimonial.create'
  | 'testimonial.update'
  | 'testimonial.delete'
  | 'testimonial.publish'
  | 'testimonial.unpublish'
  | 'testimonial.reorder'
  | 'processStep.create'
  | 'processStep.update'
  | 'processStep.delete'
  | 'processStep.publish'
  | 'processStep.unpublish'
  | 'processStep.reorder'
  | 'media.upload'

interface AuditInput {
  actorId?: string | null
  action: AuditAction
  targetType?: string
  targetId?: string
  meta?: Prisma.InputJsonValue
}

/**
 * Best-effort audit trail. Never throws into the request path — a failed
 * audit write is logged and swallowed.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        meta: input.meta ?? undefined,
      },
    })
  } catch (err) {
    console.error('[audit] failed to write entry:', input.action, err)
  }
}
