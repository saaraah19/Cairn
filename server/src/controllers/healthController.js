import mongoose from 'mongoose'
import { success } from '../utils/apiResponse.js'

const READY_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting']

export function getHealth(req, res) {
  success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: READY_STATES[mongoose.connection.readyState] ?? 'unknown',
  })
}
