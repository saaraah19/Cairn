import { getPublicActivityById, getPublicProfileByUsername } from '../services/communityService.js'
import { success } from '../utils/apiResponse.js'

export async function getActivity(req, res, next) {
  try {
    const activity = await getPublicActivityById(req.params.id)
    success(res, { activity })
  } catch (err) {
    next(err)
  }
}

export async function getProfile(req, res, next) {
  try {
    const { cursor } = req.query
    const result = await getPublicProfileByUsername(req.params.username, { activitiesCursor: cursor })
    success(res, result)
  } catch (err) {
    next(err)
  }
}
