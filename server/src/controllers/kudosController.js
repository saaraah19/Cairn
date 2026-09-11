import { giveKudos, removeKudos } from '../services/kudosService.js'
import { success } from '../utils/apiResponse.js'

export async function postKudos(req, res, next) {
  try {
    const result = await giveKudos(req.userId, req.params.id)
    success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function deleteKudos(req, res, next) {
  try {
    const result = await removeKudos(req.userId, req.params.id)
    success(res, result)
  } catch (err) {
    next(err)
  }
}
