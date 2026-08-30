import mongoose from 'mongoose'

// See docs/05_DATA_MODEL_AND_API_CONTRACT.md §6-22.
// Only name/type/date are truly required — everything else optional, to
// support both quick and detailed logging with the same model (§7).
const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },
    activityNumber: { type: Number, required: true },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    type: {
      type: String,
      enum: ['hiking', 'trekking', 'camping'],
      default: 'hiking',
      required: true,
    },
    date: { type: Date, required: true },

    location: {
      placeName: { type: String, trim: true, default: '' },
      wilaya: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
      latitude: { type: Number, min: -90, max: 90, default: null },
      longitude: { type: Number, min: -180, max: 180, default: null },
    },

    trail: {
      distanceKm: { type: Number, min: 0, default: null },
      durationMinutes: { type: Number, min: 0, default: null },
      maxAltitudeM: { type: Number, default: null },
      elevationGainM: { type: Number, min: 0, default: null },
      elevationLossM: { type: Number, min: 0, default: null },
      difficulty: {
        type: String,
        enum: ['easy', 'moderate', 'hard', 'very_hard', null],
        default: null,
      },
    },

    conditions: {
      weather: {
        type: String,
        enum: ['sunny', 'cloudy', 'rainy', 'windy', 'snowy', 'foggy', 'other', null],
        default: null,
      },
      temperatureC: { type: Number, default: null },
      trailCondition: {
        type: String,
        enum: ['dry', 'muddy', 'wet', 'snowy', 'rocky', 'other', null],
        default: null,
      },
    },

    social: {
      groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
      companions: { type: [String], default: [] },
    },

    costDzd: { type: Number, min: 0, default: null },

    review: {
      rating: { type: Number, min: 0, max: 10, default: null },
      challenges: { type: String, trim: true, maxlength: 2000, default: '' },
      notes: { type: String, trim: true, maxlength: 5000, default: '' },
    },

    destinationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', default: null },

    // Reserved for Phase 4 (Gear ↔ Activity) — not yet exposed via API input,
    // included now so that slice doesn't require a schema migration.
    gearItemIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'GearItem', default: [] },

    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'private',
    },

    // Reserved for Phase 3's photo slice (Cloudinary) — not yet populated.
    coverPhotoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo', default: null },
  },
  { timestamps: true }
)

activitySchema.index({ userId: 1, activityNumber: 1 }, { unique: true })
activitySchema.index({ userId: 1, date: -1 })
activitySchema.index({ userId: 1, type: 1 })
activitySchema.index({ userId: 1, destinationId: 1 })
activitySchema.index({ userId: 1, 'social.groupId': 1 })
// Lightweight partial-match search across name/place/wilaya/notes.
activitySchema.index({ name: 'text', 'location.placeName': 'text', 'location.wilaya': 'text', 'review.notes': 'text' })

export const Activity = mongoose.model('Activity', activitySchema)
