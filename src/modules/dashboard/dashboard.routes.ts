import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { requireMinRole } from '../_shared/auth.middleware'
import { overview } from './dashboard.controller'

const router = Router()

router.get('/', requireMinRole('viewer'), asyncHandler(overview))

export default router
