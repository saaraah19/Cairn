import {
  createPlannedActivity,
  listPlannedActivities,
  getOwnedPlannedActivity,
  updatePlannedActivity,
  deletePlannedActivity,
  completePlannedActivity,
} from '../services/plannedActivityService.js'
import { success } from '../utils/apiResponse.js'

export async function create(req, res, next) {
  try {
    const plan = await createPlannedActivity(req.userId, req.body)
    success(res, { plannedActivity: plan }, 201)
  } catch (err) {
    next(err)
  }
}

export async function list(req, res, next) {
  try {
    const { items, pagination } = await listPlannedActivities(req.userId, req.validatedQuery)
    success(res, { plannedActivities: items, pagination })
  } catch (err) {
    next(err)
  }
}

export async function getById(req, res, next) {
  try {
    const plan = await getOwnedPlannedActivity(req.userId, req.params.id)
    success(res, { plannedActivity: plan })
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const plan = await updatePlannedActivity(req.userId, req.params.id, req.body)
    success(res, { plannedActivity: plan })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await deletePlannedActivity(req.userId, req.params.id)
    success(res, { deleted: true })
  } catch (err) {
    next(err)
  }
}

export async function complete(req, res, next) {
  try {
    const plan = await completePlannedActivity(req.userId, req.params.id, req.body.activityId)
    success(res, { plannedActivity: plan })
  } catch (err) {
    next(err)
  }
}
