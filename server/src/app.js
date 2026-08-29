import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.clientUrl, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  app.use('/api/health', healthRoutes)
  app.use('/api/auth', authRoutes)

  // Future route mounts:
  // app.use('/api/activities', activityRoutes)
  // app.use('/api/gear', gearRoutes)
  // ...

  app.use(notFound)
  app.use(errorHandler)

  return app
}
