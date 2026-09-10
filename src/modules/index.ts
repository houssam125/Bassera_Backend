import { Router } from 'express'

import adminRoutes from './admin.routes'
import authRoutes from './auth/auth.routes'
import capabilitiesPublicRoutes from './capabilities/capabilities.routes'
import clientsPublicRoutes from './clients/clients.routes'
import healthRoutes from './health/health.routes'
import inquiriesPublicRoutes from './inquiries/inquiries.routes'
import monitorRoutes from './monitor/monitor.routes'
import processPublicRoutes from './process/process.routes'
import projectsPublicRoutes from './projects/projects.routes'
import siteRoutes from './site/site.routes'
import teamRoutes from './team/team.routes'
import testimonialsPublicRoutes from './testimonials/testimonials.routes'

/**
 * Aggregates every feature router under `/api`.
 *
 *   /api/health          liveness + DB readiness
 *   /api/monitor         richer ops report (status, uptime, memory, DB)
 *   /api/auth/*          register, login, refresh, logout, me (GET/PATCH)
 *   /api/projects/*      public portfolio reads
 *   /api/capabilities/*  public "Two Divisions" service cards
 *   /api/team/*          public team roster (name, role, title, bio, avatar, tags)
 *   /api/admin/*         dashboard, project + capability mgmt, user mgmt, media, audit
 */
const router = Router()

router.use('/health', healthRoutes)
router.use('/monitor', monitorRoutes)
router.use('/auth', authRoutes)
router.use('/site', siteRoutes)
router.use('/projects', projectsPublicRoutes)
router.use('/capabilities', capabilitiesPublicRoutes)
router.use('/clients', clientsPublicRoutes)
router.use('/testimonials', testimonialsPublicRoutes)
router.use('/process', processPublicRoutes)
router.use('/inquiries', inquiriesPublicRoutes)
router.use('/team', teamRoutes)
router.use('/admin', adminRoutes)

export default router
