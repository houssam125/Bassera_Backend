import type { Request, Response } from 'express'
import { z } from 'zod'

import { parse } from '../_shared/validate'
import { getTeamMember, listTeam } from './team.service'

const teamQuerySchema = z.object({
  role: z.enum(['owner', 'admin', 'editor', 'viewer']).optional(),
})

export async function list(req: Request, res: Response): Promise<void> {
  const { role } = parse(teamQuerySchema, req.query)
  res.json(await listTeam(role))
}

export async function getOne(req: Request, res: Response): Promise<void> {
  res.json(await getTeamMember(req.params.id))
}
