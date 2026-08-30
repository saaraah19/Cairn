import {
  createGear,
  listGear,
  getOwnedGear,
  updateGear,
  deleteGear,
  getGearUsage,
  uploadGearPhoto,
  removeGearPhoto,
} from '../services/gearService.js'
import { success } from '../utils/apiResponse.js'

export async function create(req, res, next) {
  try {
    const gear = await createGear(req.userId, req.body)
    success(res, { gear }, 201)
  } catch (err) {
    next(err)
  }
}

export async function list(req, res, next) {
  try {
    const { items, pagination } = await listGear(req.userId, req.validatedQuery)
    success(res, { gear: items, pagination })
  } catch (err) {
    next(err)
  }
}

export async function getById(req, res, next) {
  try {
    const gear = await getOwnedGear(req.userId, req.params.id)
    success(res, { gear })
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const gear = await updateGear(req.userId, req.params.id, req.body)
    success(res, { gear })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await deleteGear(req.userId, req.params.id)
    success(res, { deleted: true })
  } catch (err) {
    next(err)
  }
}

export async function usage(req, res, next) {
  try {
    const activities = await getGearUsage(req.userId, req.params.id)
    success(res, { activities })
  } catch (err) {
    next(err)
  }
}

export async function uploadPhoto(req, res, next) {
  try {
    const gear = await uploadGearPhoto(req.userId, req.params.id, req.file)
    success(res, { gear })
  } catch (err) {
    next(err)
  }
}

export async function removePhoto(req, res, next) {
  try {
    const gear = await removeGearPhoto(req.userId, req.params.id)
    success(res, { gear })
  } catch (err) {
    next(err)
  }
}
