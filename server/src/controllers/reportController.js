import { createReport } from '../services/reportService.js'
import { success } from '../utils/apiResponse.js'

export async function reportActivity(req, res, next) {
  try {
    const { reason, details } = req.body
    const report = await createReport(req.userId, 'activity', req.params.id, reason, details)
    success(res, { report }, 201)
  } catch (err) {
    next(err)
  }
}

export async function reportComment(req, res, next) {
  try {
    const { reason, details } = req.body
    const report = await createReport(req.userId, 'comment', req.params.commentId, reason, details)
    success(res, { report }, 201)
  } catch (err) {
    next(err)
  }
}
