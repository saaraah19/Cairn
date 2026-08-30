import { Group } from '../models/Group.js'
import { ApiError } from '../utils/apiResponse.js'

export async function listGroups(userId) {
  return Group.find({ userId }).sort({ name: 1 })
}

export async function createGroup(userId, name) {
  const existing = await Group.findOne({ userId, name })
  if (existing) return existing // idempotent — reuse rather than duplicate
  try {
    return await Group.create({ userId, name })
  } catch (err) {
    if (err.code === 11000) {
      return Group.findOne({ userId, name })
    }
    throw err
  }
}

export async function deleteGroup(userId, groupId) {
  const group = await Group.findOne({ _id: groupId, userId })
  if (!group) {
    throw new ApiError(404, 'NOT_FOUND', 'Group not found.')
  }
  await group.deleteOne()
}
