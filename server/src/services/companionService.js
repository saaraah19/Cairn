import { Companion } from '../models/Companion.js'
import { ApiError } from '../utils/apiResponse.js'

export async function listCompanions(userId) {
  return Companion.find({ userId }).sort({ name: 1 })
}

export async function createCompanion(userId, name) {
  const existing = await Companion.findOne({ userId, name })
  if (existing) return existing
  try {
    return await Companion.create({ userId, name })
  } catch (err) {
    if (err.code === 11000) {
      return Companion.findOne({ userId, name })
    }
    throw err
  }
}

export async function deleteCompanion(userId, companionId) {
  const companion = await Companion.findOne({ _id: companionId, userId })
  if (!companion) {
    throw new ApiError(404, 'NOT_FOUND', 'Companion not found.')
  }
  await companion.deleteOne()
}
