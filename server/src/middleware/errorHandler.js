import { ApiError } from '../utils/apiResponse.js'
import { env } from '../config/env.js'

// Centralized error handler. Never leaks stack traces or internal details
// to the client — see docs/02_TECHNICAL_ARCHITECTURE.md §34.
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
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
