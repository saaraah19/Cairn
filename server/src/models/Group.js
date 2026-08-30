import mongoose from 'mongoose'

// Lightweight, user-owned reference — not a group account/membership system.
// See docs/05_DATA_MODEL_AND_API_CONTRACT.md §17: "There is no group login.
// There is no group participant database."
const groupSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

groupSchema.index({ userId: 1, name: 1 }, { unique: true })

export const Group = mongoose.model('Group', groupSchema)
