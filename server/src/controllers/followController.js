import { followUserByUsername, unfollowUserByUsername } from '../services/followService.js'
import { success } from '../utils/apiResponse.js'

export async function postFollow(req, res, next) {
  try {
    const result = await followUserByUsername(req.userId, req.params.username)
    success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function deleteFollow(req, res, next) {
  try {
    const result = await unfollowUserByUsername(req.userId, req.params.username)
    success(res, result)
  } catch (err) {
    next(err)
  }
}
