import {
  createDestination,
  listDestinations,
  getOwnedDestination,
  updateDestination,
  deleteDestination,
  uploadDestinationCoverImage,
  removeDestinationCoverImage,
  getDestinationRelated,
} from '../services/destinationService.js'
import { success } from '../utils/apiResponse.js'

export async function create(req, res, next) {
  try {
    const destination = await createDestination(req.userId, req.body)
    success(res, { destination }, 201)
  } catch (err) {
    next(err)
  }
}

export async function list(req, res, next) {
  try {
    const { items, pagination } = await listDestinations(req.userId, req.validatedQuery)
    success(res, { destinations: items, pagination })
  } catch (err) {
    next(err)
  }
}

export async function getById(req, res, next) {
  try {
    const destination = await getOwnedDestination(req.userId, req.params.id)
    success(res, { destination })
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const destination = await updateDestination(req.userId, req.params.id, req.body)
    success(res, { destination })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await deleteDestination(req.userId, req.params.id)
    success(res, { deleted: true })
  } catch (err) {
    next(err)
  }
}

export async function uploadCoverImage(req, res, next) {
  try {
    const destination = await uploadDestinationCoverImage(req.userId, req.params.id, req.file)
    success(res, { destination })
  } catch (err) {
    next(err)
  }
}

export async function removeCoverImage(req, res, next) {
  try {
    const destination = await removeDestinationCoverImage(req.userId, req.params.id)
    success(res, { destination })
  } catch (err) {
    next(err)
  }
}

export async function related(req, res, next) {
  try {
    const data = await getDestinationRelated(req.userId, req.params.id)
    success(res, data)
  } catch (err) {
    next(err)
  }
}
