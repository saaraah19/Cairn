import { ApiError } from '../utils/apiResponse.js'

// Wraps a Zod schema into Express middleware. Validates req.body, replaces it
// with the parsed/coerced value, and converts Zod errors into a consistent
// 422 ApiError rather than leaking Zod's internal error shape.
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const firstIssue = result.error.issues[0]
      return next(
        new ApiError(422, 'VALIDATION_ERROR', firstIssue?.message ?? 'Invalid request body.')
      )
    }

    req.body = result.data
    next()
  }
}

// Same idea for query params. Stores the parsed/coerced result on
// req.validatedQuery rather than overwriting req.query, since Express 5
// exposes req.query as a getter that isn't safely reassignable.
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query)

    if (!result.success) {
      const firstIssue = result.error.issues[0]
      return next(
        new ApiError(422, 'VALIDATION_ERROR', firstIssue?.message ?? 'Invalid query parameters.')
      )
    }

    req.validatedQuery = result.data
    next()
  }
}
