import { ApiError } from '../utils/apiResponse.js'

export function notFound(req, res, next) {
  next(new ApiError(404, 'NOT_FOUND', `Route not found: ${req.method} ${req.originalUrl}`))
}
