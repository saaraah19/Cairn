import mongoose from 'mongoose'

// A remembered name for autocomplete/reuse across activities. Not a Cairn
// user — see docs/05_DATA_MODEL_AND_API_CONTRACT.md §18.
const companionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

companionSchema.index({ userId: 1, name: 1 }, { unique: true })

export const Companion = mongoose.model('Companion', companionSchema)
