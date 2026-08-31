import mongoose from 'mongoose'

// See docs/05_DATA_MODEL_AND_API_CONTRACT.md §23-26. A planned activity is
// intention, not history — completing it creates a separate Activity record
// rather than transforming this document (§25: "Do not transform the same
// MongoDB document into an Activity").
const plannedActivitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    type: {
      type: String,
      enum: ['hiking', 'trekking', 'camping'],
      default: 'hiking',
      required: true,
    },

    plannedDate: { type: Date, required: true },

    destinationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Destination', default: null },

    location: {
      placeName: { type: String, trim: true, default: '' },
      wilaya: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
      latitude: { type: Number, min: -90, max: 90, default: null },
      longitude: { type: Number, min: -180, max: 180, default: null },
    },

    social: {
      groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
      companions: { type: [String], default: [] },
    },

    estimatedCostDzd: { type: Number, min: 0, default: null },
    expectedDifficulty: {
      type: String,
      enum: ['easy', 'moderate', 'hard', 'very_hard', null],
      default: null,
    },

    notes: { type: String, trim: true, maxlength: 2000, default: '' },

    status: {
      type: String,
      enum: ['planned', 'ready', 'completed', 'cancelled'],
      default: 'planned',
    },

    // Reserved for Phase 6 (Pack My Bag) — not yet exposed via API input.
    packedGearItemIds: { type: [mongoose.Schema.Types.ObjectId], ref: 'GearItem', default: [] },

    completedActivityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null },
  },
  { timestamps: true }
)

plannedActivitySchema.index({ userId: 1, plannedDate: 1 })
plannedActivitySchema.index({ userId: 1, status: 1 })

export const PlannedActivity = mongoose.model('PlannedActivity', plannedActivitySchema)
