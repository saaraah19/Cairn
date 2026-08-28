import mongoose from 'mongoose'
import { env } from './env.js'

export async function connectDB() {
  if (!env.mongoUri) {
    console.warn(
      '[db] MONGODB_URI is not set — skipping database connection. ' +
        'Set MONGODB_URI in server/.env to connect to MongoDB Atlas.'
    )
    return null
  }

  try {
    await mongoose.connect(env.mongoUri)
    console.log('[db] Connected to MongoDB')
    return mongoose.connection
  } catch (err) {
    console.error('[db] Failed to connect to MongoDB:', err.message)
    throw err
  }
}
