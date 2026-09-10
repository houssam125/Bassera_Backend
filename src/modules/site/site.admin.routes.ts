import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { requireMinRole } from '../_shared/auth.middleware'
import { getPublic, patchAdmin } from './site.controller'

const router = Router()

router.use(requireMinRole('editor'))

router.get('/', asyncHandler(getPublic))
router.patch('/', asyncHandler(patchAdmin))

export default router
