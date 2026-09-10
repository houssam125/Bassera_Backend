/**
 * Operational error with an attached HTTP status code.
 * Throw this from anywhere in the request lifecycle and the
 * central error handler will turn it into a clean JSON response.
 */
export class ApiError extends Error {
  readonly statusCode: number
  readonly isOperational: boolean
  readonly details?: unknown

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.isOperational = true
    this.details = details
    Error.captureStackTrace(this, this.constructor)
  }

  static badRequest(message = 'Bad Request', details?: unknown): ApiError {
    return new ApiError(400, message, details)
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message)
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message)
  }

  static notFound(message = 'Not Found'): ApiError {
    return new ApiError(404, message)
  }

  static internal(message = 'Internal Server Error'): ApiError {
    return new ApiError(500, message)
  }
}
