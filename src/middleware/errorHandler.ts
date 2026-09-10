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
  const message =
    isApiError || err instanceof Error ? (err as Error).message : 'Internal Server Error'

  if (!isApiError || statusCode >= 500) {
    console.error('[error]', err)
  }

  const body: ErrorBody = { status: 'error', message }

  if (isApiError && err.details !== undefined) {
    body.details = err.details
  }

  if (!isProduction && err instanceof Error) {
    body.stack = err.stack
  }

  res.status(statusCode).json(body)
}
