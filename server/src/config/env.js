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
}
