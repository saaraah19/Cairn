import {
  getProfile,
  updateProfile,
  changePassword,
  uploadProfilePicture,
  removeProfilePicture,
} from '../services/profileService.js'
import { success } from '../utils/apiResponse.js'

export async function get(req, res, next) {
  try {
    const user = await getProfile(req.userId)
    success(res, { user })
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const user = await updateProfile(req.userId, req.body)
    success(res, { user })
  } catch (err) {
    next(err)
  }
}

export async function updatePassword(req, res, next) {
  try {
    await changePassword(req.userId, req.body)
    success(res, { changed: true })
  } catch (err) {
    next(err)
  }
}

export async function uploadPicture(req, res, next) {
  try {
    const user = await uploadProfilePicture(req.userId, req.file)
    success(res, { user })
  } catch (err) {
    next(err)
  }
}

export async function removePicture(req, res, next) {
  try {
    const user = await removeProfilePicture(req.userId)
    success(res, { user })
  } catch (err) {
    next(err)
  }
}
