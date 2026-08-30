import multer from 'multer'
import { ApiError } from '../utils/apiResponse.js'

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

const storage = multer.memoryStorage()

export const uploadSinglePhoto = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new ApiError(422, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, or WebP images are allowed.'))
    }
    cb(null, true)
  },
}).single('photo')

// Wraps multer's callback-style middleware so its errors (file too large,
// wrong type) flow through the same centralized error handler as everything
// else, instead of Express's default multer error format.
export function handleUpload(req, res, next) {
  uploadSinglePhoto(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(422, 'FILE_TOO_LARGE', 'Photo must be under 10MB.'))
      }
      return next(new ApiError(422, 'UPLOAD_ERROR', err.message))
    }
    if (err) return next(err)
    if (!req.file) {
      return next(new ApiError(422, 'VALIDATION_ERROR', 'No photo file was provided.'))
    }
    next()
  })
}
