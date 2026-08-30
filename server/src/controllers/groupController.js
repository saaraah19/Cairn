import { listGroups, createGroup, deleteGroup } from '../services/groupService.js'
import { success } from '../utils/apiResponse.js'

export async function list(req, res, next) {
  try {
    const groups = await listGroups(req.userId)
    success(res, { groups })
  } catch (err) {
    next(err)
  }
}

export async function create(req, res, next) {
  try {
    const group = await createGroup(req.userId, req.body.name)
    success(res, { group }, 201)
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await deleteGroup(req.userId, req.params.id)
    success(res, { deleted: true })
  } catch (err) {
    next(err)
  }
}
