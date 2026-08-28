import { createApp } from './app.js'
import { connectDB } from './config/db.js'
import { env } from './config/env.js'

async function start() {
  await connectDB()

  const app = createApp()

  app.listen(env.port, () => {
    console.log(`[server] Cairn API listening on port ${env.port} (${env.nodeEnv})`)
  })
}

start().catch((err) => {
  console.error('[server] Failed to start:', err)
  process.exit(1)
})
