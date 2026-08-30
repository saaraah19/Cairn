import {
  createActivity,
  listActivities,
  getOwnedActivity,
  updateActivity,
  deleteActivity,
} from '../services/activityService.js'
import { success } from '../utils/apiResponse.js'

export async function create(req, res, next) {
  try {
    const activity = await createActivity(req.userId, req.body)
    success(res, { activity }, 201)
  } catch (err) {
    next(err)
  }
}

export async function list(req, res, next) {
  try {
    const { items, pagination } = await listActivities(req.userId, req.validatedQuery)
    success(res, { activities: items, pagination })
  } catch (err) {
    next(err)
  }
}

export async function getById(req, res, next) {
  try {
    const activity = await getOwnedActivity(req.userId, req.params.id)
    success(res, { activity })
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const activity = await updateActivity(req.userId, req.params.id, req.body)
    success(res, { activity })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await deleteActivity(req.userId, req.params.id)
    success(res, { deleted: true })
  } catch (err) {
    next(err)
  }
}
