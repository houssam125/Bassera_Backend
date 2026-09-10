import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { getMeta, getPublic, listPublic } from './capabilities.controller'

// Public — the homepage "Two Divisions" section.
const router = Router()

router.get('/meta', asyncHandler(getMeta))
router.get('/', asyncHandler(listPublic))
router.get('/:idOrSlug', asyncHandler(getPublic))

export default router
