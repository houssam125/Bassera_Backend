import type { Request, Response } from 'express'

import { ApiError } from '../../shared/ApiError'
import { recordAudit } from '../_shared/audit'
import { parse } from '../_shared/validate'
import {
  createInquirySchema,
  listInquiriesQuerySchema,
  updateInquirySchema,
} from './inquiries.schemas'
import {
  createInquiry,
  deleteInquiry,
  getInquiry,
  listInquiries,
  setInquiryStatus,
} from './inquiries.service'

// --- public ------------------------------------------------------------------

export async function submit(req: Request, res: Response): Promise<void> {
  const input = parse(createInquirySchema, req.body)
  // Honeypot filled → pretend success, store nothing.
  if (input.website) {
    res.status(202).json({ status: 'received' })
    return
  }
  const inquiry = await createInquiry(input, {
    ip: req.ip,
    userAgent: req.get('user-agent') ?? undefined,
  })
  await recordAudit({
    action: 'inquiry.create',
    targetType: 'inquiry',
    targetId: inquiry.id,
    meta: { service: inquiry.service, budget: inquiry.budget },
  })
  res.status(201).json({ status: 'received', id: inquiry.id })
}

// --- admin -----------------------------------------------------------------

export async function list(req: Request, res: Response): Promise<void> {
  const query = parse(listInquiriesQuerySchema, req.query)
  res.json(await listInquiries(query))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  res.json(await getInquiry(req.params.id))
}

export async function update(req: Request, res: Response): Promise<void> {
  const { status } = parse(updateInquirySchema, req.body)
  const inquiry = await setInquiryStatus(req.params.id, status)
  await recordAudit({
    actorId: req.user?.id,
    action: 'inquiry.update',
    targetType: 'inquiry',
    targetId: req.params.id,
    meta: { status },
  })
  res.json(inquiry)
}

export async function remove(req: Request, res: Response): Promise<void> {
  if (req.user?.role !== 'admin' && req.user?.role !== 'owner') {
    throw ApiError.forbidden('Only an admin or owner can delete inquiries')
  }
  await deleteInquiry(req.params.id)
  await recordAudit({
    actorId: req.user?.id,
    action: 'inquiry.delete',
    targetType: 'inquiry',
    targetId: req.params.id,
  })
  res.status(204).send()
}
