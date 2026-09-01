import { getStatistics } from '../services/statisticsService.js'
import { success } from '../utils/apiResponse.js'

export async function get(req, res, next) {
  try {
    const stats = await getStatistics(req.userId)
    success(res, stats)
  } catch (err) {
    next(err)
  }
}
