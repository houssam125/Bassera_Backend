import type { Request, Response } from 'express'

import { ApiError } from '../../shared/ApiError'
import { parse } from '../_shared/validate'
import {
  approveSchema,
  listUsersQuerySchema,
  rejectSchema,
  suspendSchema,
  updateUserSchema,
} from './users.schemas'
import {
  approveUser,
  deleteUser,
  getUser,
  listUsers,
  reactivateUser,
  rejectUser,
  suspendUser,
  updateUser,
} from './users.service'

function actor(req: Request): { id: string; role: NonNullable<Request['user']>['role'] } {
  if (!req.user) throw ApiError.unauthorized()
  return { id: req.user.id, role: req.user.role }
}

export async function list(req: Request, res: Response): Promise<void> {
  const query = parse(listUsersQuerySchema, req.query)
  res.json(await listUsers(query))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  res.json(await getUser(req.params.id))
}

export async function approve(req: Request, res: Response): Promise<void> {
  const { role } = parse(approveSchema, req.body)
  res.json(await approveUser(req.params.id, role, actor(req).id))
}

export async function reject(req: Request, res: Response): Promise<void> {
  const { reason } = parse(rejectSchema, req.body ?? {})
  res.json(await rejectUser(req.params.id, reason, actor(req).id))
}

export async function suspend(req: Request, res: Response): Promise<void> {
  const { reason } = parse(suspendSchema, req.body ?? {})
  res.json(await suspendUser(req.params.id, reason, actor(req).id))
}

export async function reactivate(req: Request, res: Response): Promise<void> {
  res.json(await reactivateUser(req.params.id, actor(req).id))
}

export async function patch(req: Request, res: Response): Promise<void> {
  const body = parse(updateUserSchema, req.body)
  res.json(await updateUser(req.params.id, body, actor(req)))
}

export async function remove(req: Request, res: Response): Promise<void> {
  await deleteUser(req.params.id, actor(req).id)
  res.status(204).send()
}
