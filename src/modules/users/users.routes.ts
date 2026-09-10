import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { requireMinRole, requireRole } from '../_shared/auth.middleware'
import {
  approve,
  getOne,
  list,
  patch,
  reactivate,
  reject,
  remove,
  suspend,
} from './users.controller'

const router = Router()

// admin or owner for all user management
router.use(requireMinRole('admin'))

router.get('/', asyncHandler(list))
router.get('/:id', asyncHandler(getOne))
router.post('/:id/approve', asyncHandler(approve))
router.post('/:id/reject', asyncHandler(reject))
router.post('/:id/suspend', asyncHandler(suspend))
router.post('/:id/reactivate', asyncHandler(reactivate))
router.patch('/:id', asyncHandler(patch))
router.delete('/:id', requireRole('owner'), asyncHandler(remove))

export default router
