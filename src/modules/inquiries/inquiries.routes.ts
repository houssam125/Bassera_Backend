import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { inquiryLimiter } from '../_shared/rateLimiters'
import { submit } from './inquiries.controller'

// Public — the "Start a Project" contact form posts here.
const router = Router()

router.post('/', inquiryLimiter, asyncHandler(submit))

export default router
