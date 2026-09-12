import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../services/notificationService.js'
import { success } from '../utils/apiResponse.js'

export async function getNotifications(req, res, next) {
  try {
    const { cursor, limit } = req.validatedQuery
    const result = await listNotifications(req.userId, { cursor, limit })
    success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getUnreadCountHandler(req, res, next) {
  try {
    const result = await getUnreadCount(req.userId)
    success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function patchMarkAsRead(req, res, next) {
  try {
    const result = await markAsRead(req.userId, req.params.id)
    success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function patchMarkAllAsRead(req, res, next) {
  try {
    const result = await markAllAsRead(req.userId)
    success(res, result)
  } catch (err) {
    next(err)
  }
}
