import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { getMeta, getPublic, listPublic } from './projects.controller'

const router = Router()

// Static route must precede the `:idOrSlug` catch-all.
router.get('/meta', asyncHandler(getMeta))
router.get('/', asyncHandler(listPublic))
router.get('/:idOrSlug', asyncHandler(getPublic))

export default router
