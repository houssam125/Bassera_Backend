import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { requireMinRole } from '../_shared/auth.middleware'
import { getOne, list, remove, update } from './inquiries.controller'

const router = Router()

// editor+ can read and triage; delete is gated to admin+ in the controller.
router.use(requireMinRole('editor'))

router.get('/', asyncHandler(list))
router.get('/:id', asyncHandler(getOne))
router.patch('/:id', asyncHandler(update))
router.delete('/:id', asyncHandler(remove))

export default router
