import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { requireMinRole } from '../_shared/auth.middleware'
import { mediaLimiter } from '../_shared/rateLimiters'
import { uploadMedia, uploadSingleFile } from './media.controller'

const router = Router()

router.post(
  '/',
  requireMinRole('editor'),
  mediaLimiter,
  uploadSingleFile,
  asyncHandler(uploadMedia),
)

export default router
