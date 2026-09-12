import type { Request, Response, NextFunction } from 'express'
import { ApiError } from '../shared/ApiError'
import { isProduction } from '../config/env'

interface ErrorBody {
  status: 'error'
  message: string
  details?: unknown
  stack?: string
}

/**
 * Central error handler. Must be registered last, after all routes.
 * Express identifies it as an error handler by its four arguments.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isApiError = err instanceof ApiError
  const statusCode = isApiError ? err.statusCode : 500

  if (!isApiError || statusCode >= 500) {
    console.error('[error]', err)
  }

  // ApiError messages are deliberately written to be shown to the client.
  // Anything else (bugs, Prisma/driver errors, etc.) can carry internal
  // details — env var names, schema paths, SQL — that must never reach the
  // public API response in production.
  const message = isApiError
    ? err.message
    : !isProduction && err instanceof Error
      ? err.message
      : 'Internal Server Error'

  const body: ErrorBody = { status: 'error', message }

  if (isApiError && err.details !== undefined) {
    body.details = err.details
  }

  if (!isProduction && err instanceof Error) {
    body.stack = err.stack
  }

  res.status(statusCode).json(body)
}
