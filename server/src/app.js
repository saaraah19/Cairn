import express from 'express'
import cors from 'cors'
import { env } from './config/env.js'
import healthRoutes from './routes/health.routes.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.clientUrl, credentials: true }))
  app.use(express.json())

  app.use('/api/health', healthRoutes)

  // Future route mounts (Phase 1+):
  // app.use('/api/auth', authRoutes)
  // app.use('/api/activities', activityRoutes)
  // app.use('/api/gear', gearRoutes)
  // ...

  app.use(notFound)
  app.use(errorHandler)

  return app
}
