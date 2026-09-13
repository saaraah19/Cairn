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
import plannedActivityRoutes from './routes/plannedActivity.routes.js'
import destinationRoutes from './routes/destination.routes.js'
import statisticsRoutes from './routes/statistics.routes.js'
import profileRoutes from './routes/profile.routes.js'
import dataRoutes from './routes/data.routes.js'
import communityRoutes from './routes/community.routes.js'
import notificationRoutes from './routes/notification.routes.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'

export function createApp() {
  const app = express()

  // Render (and most PaaS platforms) sit the app behind a reverse proxy.
  // Without this, every request appears to originate from the proxy's
  // single IP, which would make IP-keyed rate limiting (authRateLimiter)
  // completely ineffective in production — everyone would share one
  // bucket. `1` trusts exactly one hop (the platform's own proxy), not an
  // arbitrary chain of forwarded-for headers an attacker could spoof.
  app.set('trust proxy', 1)

  // origin as a function (rather than a plain string) lets us support a
  // comma-separated CLIENT_URL list — e.g. Render's default *.onrender.com
  // URL plus a custom domain added later — without needing '*' (which
  // can't be combined with credentials: true).
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || env.clientUrls.includes(origin)) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true,
    })
  )
  app.use(express.json())
  app.use(cookieParser())

  app.use('/api/health', healthRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/activities', activityRoutes)
  app.use('/api/photos', photoRoutes)
  app.use('/api/groups', groupRoutes)
  app.use('/api/companions', companionRoutes)
  app.use('/api/gear', gearRoutes)
  app.use('/api/planned-activities', plannedActivityRoutes)
  app.use('/api/destinations', destinationRoutes)
  app.use('/api/statistics', statisticsRoutes)
  app.use('/api/profile', profileRoutes)
  app.use('/api/profile', dataRoutes)
  app.use('/api/community', communityRoutes)
  app.use('/api/notifications', notificationRoutes)

  app.use(notFound)
  app.use(errorHandler)

  return app
}
