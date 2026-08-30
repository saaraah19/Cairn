import mongoose from 'mongoose'

// Backs atomic per-user sequence numbers (currently just activityNumber).
// One document per (userId, sequence) pair. See docs/02_TECHNICAL_ARCHITECTURE.md
// §12: numbering must avoid race conditions on concurrent creation and must
// never be reused after deletion — an atomic $inc via findOneAndUpdate gives
// us both properties without needing a multi-document transaction.
const counterSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sequence: { type: String, required: true }, // e.g. 'activityNumber'
  value: { type: Number, default: 0 },
})

counterSchema.index({ userId: 1, sequence: 1 }, { unique: true })

const Counter = mongoose.model('Counter', counterSchema)

export async function getNextSequenceValue(userId, sequence) {
  const counter = await Counter.findOneAndUpdate(
    { userId, sequence },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  )
  return counter.value
}
