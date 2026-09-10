import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { listPublic } from './process.controller'

// Public — the homepage "How We Work" roadmap.
const router = Router()

router.get('/', asyncHandler(listPublic))

export default router
