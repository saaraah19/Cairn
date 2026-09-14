import { getPublicActivityById, getPublicProfileByUsername, listPublicFeed } from '../services/communityService.js'
import { success } from '../utils/apiResponse.js'

export async function getActivity(req, res, next) {
  try {
    const activity = await getPublicActivityById(req.params.id, req.userId)
    success(res, { activity })
  } catch (err) {
    next(err)
  }
}

export async function getProfile(req, res, next) {
  try {
    const { cursor } = req.query
    const result = await getPublicProfileByUsername(req.params.username, {
      activitiesCursor: cursor,
      viewerUserId: req.userId,
    })
    success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getFeed(req, res, next) {
  try {
    const { scope, type, wilaya, search, cursor } = req.query
    const result = await listPublicFeed({ scope, type, wilaya, search, cursor, viewerUserId: req.userId })
    success(res, result)
  } catch (err) {
    next(err)
  }
}
