import { PrismaClient } from '@prisma/client'

import { isProduction } from '../config/env'

/**
 * A single shared PrismaClient for the whole process.
 *
 * In development `nodemon` reloads the module graph on every change; caching the
 * client on `globalThis` prevents a new client (and a new connection pool) from
 * being created on each reload.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ['error', 'warn'] : ['error', 'warn', 'query'],
  })

if (!isProduction) {
  globalForPrisma.prisma = prisma
}
