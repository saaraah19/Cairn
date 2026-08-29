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
