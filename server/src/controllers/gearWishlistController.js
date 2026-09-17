import {
  createWishlistItem,
  listWishlistItems,
  getOwnedWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
  addOption,
  updateOption,
  deleteOption,
  purchaseOption,
} from '../services/gearWishlistService.js'
import { success } from '../utils/apiResponse.js'

export async function create(req, res, next) {
  try {
    const item = await createWishlistItem(req.userId, req.body)
    success(res, { wishlistItem: item }, 201)
  } catch (err) {
    next(err)
  }
}

export async function list(req, res, next) {
  try {
    const items = await listWishlistItems(req.userId, req.validatedQuery)
    success(res, { wishlistItems: items })
  } catch (err) {
    next(err)
  }
}

export async function getById(req, res, next) {
  try {
    const item = await getOwnedWishlistItem(req.userId, req.params.id)
    success(res, { wishlistItem: item })
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const item = await updateWishlistItem(req.userId, req.params.id, req.body)
    success(res, { wishlistItem: item })
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await deleteWishlistItem(req.userId, req.params.id)
    success(res, { deleted: true })
  } catch (err) {
    next(err)
  }
}

export async function postOption(req, res, next) {
  try {
    const item = await addOption(req.userId, req.params.id, req.body)
    success(res, { wishlistItem: item }, 201)
  } catch (err) {
    next(err)
  }
}

export async function patchOption(req, res, next) {
  try {
    const item = await updateOption(req.userId, req.params.id, req.params.optionId, req.body)
    success(res, { wishlistItem: item })
  } catch (err) {
    next(err)
  }
}

export async function removeOption(req, res, next) {
  try {
    const item = await deleteOption(req.userId, req.params.id, req.params.optionId)
    success(res, { wishlistItem: item })
  } catch (err) {
    next(err)
  }
}

export async function postPurchaseOption(req, res, next) {
  try {
    const result = await purchaseOption(req.userId, req.params.id, req.params.optionId)
    success(res, result, 201)
  } catch (err) {
    next(err)
  }
}
