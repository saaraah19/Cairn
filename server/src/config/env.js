import dotenv from 'dotenv'

// quiet: true suppresses dotenv's informational/promotional console output.
dotenv.config({ quiet: true })

const required = (name, fallback) => {
  const value = process.env[name] ?? fallback
  return value
}

export const env = {
  nodeEnv: required('NODE_ENV', 'development'),
  port: Number(required('PORT', 5000)),
  mongoUri: required('MONGODB_URI', ''),
  clientUrl: required('CLIENT_URL', 'http://localhost:5173'),
  jwtAccessSecret: required('JWT_ACCESS_SECRET', ''),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET', ''),
  googleClientId: required('GOOGLE_CLIENT_ID', ''),
}

if (env.nodeEnv === 'production' && (!env.jwtAccessSecret || !env.jwtRefreshSecret)) {
  throw new Error(
    'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set in production. ' +
      'Refusing to start with insecure/default auth secrets.'
  )
}

if (env.nodeEnv !== 'production' && (!env.jwtAccessSecret || !env.jwtRefreshSecret)) {
  console.warn(
    '[env] JWT_ACCESS_SECRET / JWT_REFRESH_SECRET not set — using insecure development ' +
      'fallback secrets. Set real values in server/.env before deploying.'
  )
  env.jwtAccessSecret ||= 'dev-only-insecure-access-secret'
  env.jwtRefreshSecret ||= 'dev-only-insecure-refresh-secret'
}
