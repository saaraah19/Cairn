import mongoose from 'mongoose'

// See docs/05_DATA_MODEL_AND_API_CONTRACT.md §27-28. Independent of
// PlannedActivity — a destination can exist with or without a plan, and
// vice versa (§28). Never merge these concepts.
const destinationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },

    name: { type: String, required: true, trim: true, maxlength: 150 },

    location: {
      placeName: { type: String, trim: true, default: '' },
      wilaya: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
      latitude: { type: Number, min: -90, max: 90, default: null },
      longitude: { type: Number, min: -180, max: 180, default: null },
    },

    // wishlist/planned/visited, per docs/02_TECHNICAL_ARCHITECTURE.md §18.
    status: {
      type: String,
      enum: ['wishlist', 'planned', 'visited'],
      default: 'wishlist',
    },

    targetDate: { type: Date, default: null },

    description: { type: String, trim: true, maxlength: 2000, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },

    // Single cover image, same pattern as GearItem.photo — metadata only,
    // binary lives in Cloudinary.
    coverImage: {
      cloudinaryPublicId: { type: String, default: null },
      secureUrl: { type: String, default: null },
    },

    links: { type: [String], default: [] },
  },
  { timestamps: true }
)

destinationSchema.index({ userId: 1, status: 1 })
destinationSchema.index({ name: 'text', 'location.placeName': 'text', 'location.wilaya': 'text' })

export const Destination = mongoose.model('Destination', destinationSchema)
