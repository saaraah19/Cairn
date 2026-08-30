import mongoose from 'mongoose'

// See docs/05_DATA_MODEL_AND_API_CONTRACT.md §35-36. Image binaries live in
// Cloudinary; this stores only metadata + references.
const photoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    activityId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Activity', index: true },

    cloudinaryPublicId: { type: String, required: true },
    secureUrl: { type: String, required: true },

    width: { type: Number, default: null },
    height: { type: Number, default: null },

    isCover: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Photo = mongoose.model('Photo', photoSchema)
