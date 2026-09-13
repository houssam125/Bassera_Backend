import { PrismaClient } from '@prisma/client'

import { env, isProduction } from '../config/env'

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
    // schema.prisma declares `url = env("DATABASE_URL")`, but `env.databaseUrl`
    // may have been assembled from separate DB_USER/DB_HOST/DB_NAME/DB_PASSWORD/
    // DB_PORT parts instead — pass it explicitly so that path is actually used.
    ...(env.databaseUrl ? { datasources: { db: { url: env.databaseUrl } } } : {}),
  })

if (!isProduction) {
  globalForPrisma.prisma = prisma
}
