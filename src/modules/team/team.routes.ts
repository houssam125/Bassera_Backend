import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { getOne, list } from './team.controller'

// Public — the website's "Team" / "About" page.
const router = Router()

router.get('/', asyncHandler(list))
router.get('/:id', asyncHandler(getOne))

export default router
