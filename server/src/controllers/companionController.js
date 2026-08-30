import { listCompanions, createCompanion, deleteCompanion } from '../services/companionService.js'
import { success } from '../utils/apiResponse.js'

export async function list(req, res, next) {
  try {
    const companions = await listCompanions(req.userId)
    success(res, { companions })
  } catch (err) {
    next(err)
  }
}

export async function create(req, res, next) {
  try {
    const companion = await createCompanion(req.userId, req.body.name)
    success(res, { companion }, 201)
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await deleteCompanion(req.userId, req.params.id)
    success(res, { deleted: true })
  } catch (err) {
    next(err)
  }
}
