import { v2 as cloudinary } from 'cloudinary'
import { env } from './env.js'

let configured = false

export function getCloudinary() {
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    return null // Photo features degrade gracefully — see photoService.js
  }

  if (!configured) {
    cloudinary.config({
      cloud_name: env.cloudinaryCloudName,
      api_key: env.cloudinaryApiKey,
      api_secret: env.cloudinaryApiSecret,
      secure: true,
    })
    configured = true
  }

  return cloudinary
}
