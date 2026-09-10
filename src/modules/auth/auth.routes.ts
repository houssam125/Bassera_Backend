import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { requireActive, requireAuth } from '../_shared/auth.middleware'
import { authLimiter, refreshLimiter } from '../_shared/rateLimiters'
import {
  login,
  logoutController,
  me,
  patchMe,
  refresh,
  register,
} from './auth.controller'

const router = Router()

router.post('/register', authLimiter, asyncHandler(register))
router.post('/login', authLimiter, asyncHandler(login))
router.post('/refresh', refreshLimiter, asyncHandler(refresh))
router.post('/logout', asyncHandler(logoutController))
router.get('/me', requireAuth, asyncHandler(me))
router.patch('/me', requireAuth, requireActive, asyncHandler(patchMe))

export default router
