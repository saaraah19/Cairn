import mongoose from 'mongoose'

// See docs/05_DATA_MODEL_AND_API_CONTRACT.md §29-32. Different physical
// items must remain independently identifiable even with the same
// brand/name (§30) — GearItem records are never deduplicated by name.
const gearItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },

    name: { type: String, required: true, trim: true, maxlength: 150 },
    category: {
      type: String,
      enum: [
        'clothing',
        'footwear',
        'backpack',
        'shelter',
        'sleeping',
        'cooking',
        'hydration',
        'navigation',
        'lighting',
        'safety',
        'accessories',
        'other',
      ],
      default: 'other',
      required: true,
    },
    brand: { type: String, trim: true, maxlength: 100, default: '' },
    model: { type: String, trim: true, maxlength: 100, default: '' },

    quantity: { type: Number, min: 1, default: 1 },
    weightGrams: { type: Number, min: 0, default: null },

    purchaseDate: { type: Date, default: null },
    purchasePriceDzd: { type: Number, min: 0, default: null },

    condition: {
      type: String,
      enum: ['new', 'good', 'worn', 'needs_repair', 'retired', null],
      default: null,
    },

    // Single image, not a gallery — unlike Activity photos. Metadata only;
    // the binary lives in Cloudinary, same pipeline as activity photos.
    photo: {
      cloudinaryPublicId: { type: String, default: null },
      secureUrl: { type: String, default: null },
    },

    store: { type: String, trim: true, maxlength: 150, default: '' },
    productUrl: { type: String, trim: true, maxlength: 500, default: '' },

    notes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true }
)

gearItemSchema.index({ userId: 1, category: 1 })
gearItemSchema.index({ name: 'text', brand: 'text', model: 'text', notes: 'text' })

export const GearItem = mongoose.model('GearItem', gearItemSchema)
