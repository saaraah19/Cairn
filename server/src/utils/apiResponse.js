// Consistent API response envelope per docs/05_DATA_MODEL_AND_API_CONTRACT.md §52

export function success(res, data, status = 200) {
  return res.status(status).json({ success: true, data })
}

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message)
    this.status = status
    this.code = code
  }
}
