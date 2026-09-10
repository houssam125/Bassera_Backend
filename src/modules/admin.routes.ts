import { Router } from 'express'

import { requireActive, requireAuth } from './_shared/auth.middleware'
import { adminMutationLimiter } from './_shared/rateLimiters'
import auditRoutes from './audit/audit.routes'
import capabilitiesAdminRoutes from './capabilities/capabilities.admin.routes'
import clientsAdminRoutes from './clients/clients.admin.routes'
import dashboardRoutes from './dashboard/dashboard.routes'
import inquiriesAdminRoutes from './inquiries/inquiries.admin.routes'
import mediaRoutes from './media/media.routes'
import processAdminRoutes from './process/process.admin.routes'
import projectsAdminRoutes from './projects/projects.admin.routes'
import siteAdminRoutes from './site/site.admin.routes'
import testimonialsAdminRoutes from './testimonials/testimonials.admin.routes'
import usersRoutes from './users/users.routes'

const router = Router()

// Every /api/admin/* route needs a valid access token and an active account.
router.use(requireAuth, requireActive, adminMutationLimiter)

router.use('/overview', dashboardRoutes)
router.use('/site', siteAdminRoutes)
router.use('/projects', projectsAdminRoutes)
router.use('/capabilities', capabilitiesAdminRoutes)
router.use('/clients', clientsAdminRoutes)
router.use('/testimonials', testimonialsAdminRoutes)
router.use('/process', processAdminRoutes)
router.use('/inquiries', inquiriesAdminRoutes)
router.use('/users', usersRoutes)
router.use('/media', mediaRoutes)
router.use('/audit', auditRoutes)

export default router
