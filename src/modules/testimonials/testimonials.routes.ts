import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { listPublic } from './testimonials.controller'

// Public — the homepage "What Our Partners Say" section.
const router = Router()

router.get('/', asyncHandler(listPublic))

export default router
