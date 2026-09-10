import { Router } from 'express'

import { asyncHandler } from '../_shared/asyncHandler'
import { requireMinRole } from '../_shared/auth.middleware'
import {
  create,
  getAdmin,
  listAdmin,
  publish,
  remove,
  reorder,
  unpublish,
  update,
} from './process.controller'

const router = Router()

router.use(requireMinRole('editor'))

router.get('/', asyncHandler(listAdmin))
router.post('/', asyncHandler(create))
router.patch('/reorder', asyncHandler(reorder)) // before :id
router.get('/:id', asyncHandler(getAdmin))
router.patch('/:id', asyncHandler(update))
router.delete('/:id', asyncHandler(remove))
router.post('/:id/publish', asyncHandler(publish))
router.post('/:id/unpublish', asyncHandler(unpublish))

export default router
