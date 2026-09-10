import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { getPublic, listPublic } from './clients.controller'

// Public — the homepage "Trusted by growing companies" strip.
const router = Router()

router.get('/', asyncHandler(listPublic))
router.get('/:idOrSlug', asyncHandler(getPublic))

export default router
