import { Readable } from 'node:stream'

// Shared by photoService (activity photo gallery) and gearService (single
// gear photo) — uploads an in-memory buffer (from multer) to Cloudinary via
// its streaming API, wrapped in a Promise.
export function uploadBufferToCloudinary(cloudinary, buffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    Readable.from(buffer).pipe(uploadStream)
  })
}
