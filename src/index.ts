import { createApp } from './app'
import { env } from './config/env'
import { prisma } from './db/prisma'
import { recordStartup } from './modules/health/health.service'

async function main(): Promise<void> {
  let dbConnected = false
  try {
    await prisma.$connect()
    dbConnected = true
    console.log('[bassera-backend] database connected')
  } catch (err) {
    // Don't crash the whole process over a bad/missing DATABASE_URL — start the
    // HTTP server anyway so it's reachable and /api/health reports the real
    // problem, instead of Render just seeing an opaque crash loop.
    console.error(
      '[bassera-backend] database connection FAILED — starting anyway in a degraded ' +
        'state. Fix DATABASE_URL in your host\'s environment settings and redeploy:',
      err,
    )
  }

  if (dbConnected) {
    try {
      await recordStartup()
    } catch (err) {
      console.warn('[bassera-backend] could not record startup marker (migrations pending?):', err)
    }
  }

  const app = createApp()
  const server = app.listen(env.port, () => {
    console.log(`[bassera-backend] listening on http://localhost:${env.port} (${env.nodeEnv})`)
  })

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[bassera-backend] port ${env.port} is already in use. ` +
          `Run "npm run free-port" or set a different PORT in .env.`,
      )
    } else {
      console.error('[bassera-backend] server error:', err)
    }
    process.exit(1)
  })

  let shuttingDown = false
  const shutdown = (signal: string) => {
    if (shuttingDown) return
    shuttingDown = true
    console.log(`\n[bassera-backend] ${signal} received, shutting down…`)

    // Force-exit if a hung connection keeps server.close() from finishing.
    const hardStop = setTimeout(() => {
      console.warn('[bassera-backend] forced exit')
      process.exit(0)
    }, 5000)
    hardStop.unref()

    server.closeAllConnections?.()
    server.close(() => {
      void prisma.$disconnect().finally(() => {
        clearTimeout(hardStop)
        console.log('[bassera-backend] closed')
        process.exit(0)
      })
    })
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

process.on('unhandledRejection', (reason) => {
  console.error('[bassera-backend] unhandled rejection:', reason)
})

main().catch((err) => {
  console.error('[bassera-backend] failed to start:', err)
  process.exit(1)
})
