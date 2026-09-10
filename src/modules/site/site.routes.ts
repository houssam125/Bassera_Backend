import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { getPublic } from './site.controller'

// Public — editable homepage copy (hero, contact, social links).
const router = Router()

router.get('/', asyncHandler(getPublic))

export default router
