import type { ZodType } from 'zod'
import { ZodError } from 'zod'

import { ApiError } from '../../shared/ApiError'

/** Turn a ZodError into the `{ path, message }[]` shape the error handler expects. */
export function zodDetails(err: ZodError): Array<{ path: string; message: string }> {
  return err.issues.map(issue => ({
    path: issue.path.map(String).join('.') || '(root)',
    message: issue.message,
  }))
}

/** Parse `data` with `schema`, or throw a `400` ApiError carrying field details. */
export function parse<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    throw ApiError.badRequest('Validation failed', zodDetails(result.error))
  }
  return result.data
}

export { ZodError }
