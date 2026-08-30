import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { env } from './config/env.js'
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import activityRoutes from './routes/activity.routes.js'
import photoRoutes from './routes/photo.routes.js'
import groupRoutes from './routes/group.routes.js'
import companionRoutes from './routes/companion.routes.js'
import gearRoutes from './routes/gear.routes.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: env.clientUrl, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  app.use('/api/health', healthRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/activities', activityRoutes)
  app.use('/api/photos', photoRoutes)
  app.use('/api/groups', groupRoutes)
  app.use('/api/companions', companionRoutes)
  app.use('/api/gear', gearRoutes)

  // Future route mounts:
  // app.use('/api/planned-activities', plannedActivityRoutes)
  // app.use('/api/destinations', destinationRoutes)
  // ...

  app.use(notFound)
  app.use(errorHandler)

  return app
}
