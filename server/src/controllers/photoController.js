import {
  uploadActivityPhoto,
  listActivityPhotos,
  setCoverPhoto,
  deleteActivityPhoto,
} from '../services/photoService.js'
import { success } from '../utils/apiResponse.js'

export async function upload(req, res, next) {
  try {
    const photo = await uploadActivityPhoto(req.userId, req.params.id, req.file)
    success(res, { photo }, 201)
  } catch (err) {
    next(err)
  }
}

export async function list(req, res, next) {
  try {
    const photos = await listActivityPhotos(req.userId, req.params.id)
    success(res, { photos })
  } catch (err) {
    next(err)
  }
}

export async function setCover(req, res, next) {
  try {
    const photo = await setCoverPhoto(req.userId, req.params.id, req.params.photoId)
    success(res, { photo })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await deleteActivityPhoto(req.userId, req.params.photoId)
    success(res, { deleted: true })
  } catch (err) {
    next(err)
  }
}
