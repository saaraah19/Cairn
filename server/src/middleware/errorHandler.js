import { ApiError } from '../utils/apiResponse.js'
import { env } from '../config/env.js'

// Centralized error handler. Never leaks stack traces or internal details
// to the client — see docs/02_TECHNICAL_ARCHITECTURE.md §34.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Malformed MongoDB ObjectId in a route param (e.g. GET /api/activities/xyz)
  // — treat as "not found" rather than leaking a Mongoose stack trace as a 500.
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res
      .status(404)
      .json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found.' } })
  }

  // Unique-index violation not already caught at the service layer.
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      error: { code: 'CONFLICT', message: 'That value is already in use.' },
    })
  }

  const isApiError = err instanceof ApiError
  const status = isApiError ? err.status : 500
  const code = isApiError ? err.code : 'INTERNAL_SERVER_ERROR'
  const message = isApiError ? err.message : 'Something went wrong. Please try again.'

  if (!isApiError) {
    console.error('[error]', err)
  }

  const body = { success: false, error: { code, message } }

  if (env.nodeEnv !== 'production' && !isApiError) {
    body.error.debug = err.message
  }

  res.status(status).json(body)
}
