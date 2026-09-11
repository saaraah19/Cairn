import { listComments, createComment, updateComment, deleteComment } from '../services/commentService.js'
import { success } from '../utils/apiResponse.js'

export async function getComments(req, res, next) {
  try {
    const { cursor, limit } = req.validatedQuery
    const result = await listComments(req.params.id, { cursor, limit })
    success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function postComment(req, res, next) {
  try {
    const comment = await createComment(req.userId, req.params.id, req.body.text)
    success(res, { comment }, 201)
  } catch (err) {
    next(err)
  }
}

export async function patchComment(req, res, next) {
  try {
    const comment = await updateComment(req.userId, req.params.commentId, req.body.text)
    success(res, { comment })
  } catch (err) {
    next(err)
  }
}

export async function removeComment(req, res, next) {
  try {
    await deleteComment(req.userId, req.params.commentId)
    success(res, { deleted: true })
  } catch (err) {
    next(err)
  }
}
