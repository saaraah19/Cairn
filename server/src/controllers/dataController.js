import { exportUserData, deleteAccount } from '../services/dataService.js'
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME, accessCookieOptions, refreshCookieOptions } from '../utils/tokens.js'

export async function exportData(req, res, next) {
  try {
    const data = await exportUserData(req.userId)
    res.setHeader('Content-Disposition', 'attachment; filename="cairn-export.json"')
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(JSON.stringify(data, null, 2))
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await deleteAccount(req.userId, req.body.currentPassword)
    // Clear the session — there's no account left to be authenticated as.
    res.clearCookie(ACCESS_COOKIE_NAME, accessCookieOptions())
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions())
    res.status(200).json({ success: true, data: { deleted: true } })
  } catch (err) {
    next(err)
  }
}
