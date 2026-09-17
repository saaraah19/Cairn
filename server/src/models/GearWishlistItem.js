import mongoose from 'mongoose'

// Product-owner request, 2026-09-14 (07_POST_V1_ROADMAP.md §C). A
// deliberately SEPARATE collection from GearItem, not a status flag on
// it — the product owner was explicit about this distinction:
//
//   Gear Closet (GearItem)      = what I actually own
//   Gear I Need to Buy (this)   = what I want/plan to buy
//   an option (embedded below)  = one specific version of that want
//                                 I'm considering
//
// Options are embedded subdocuments, not a separate collection — an
// option has no independent lifecycle or query pattern outside "the
// options for this one wishlist item" (docs/02_TECHNICAL_ARCHITECTURE.md
// §38's own embedding rule: small data tightly bound to its parent).
// Each option gets its own _id automatically (Mongoose default for
// subdocuments), which is what purchasedOptionId below references.
const gearWishlistOptionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    priceDzd: { type: Number, min: 0, default: null },
    store: { type: String, trim: true, maxlength: 150, default: '' },
    productUrl: { type: String, trim: true, maxlength: 500, default: '' },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true }
)

const gearWishlistItemSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User', index: true },

    // The general need/article — e.g. "Sleeping Mat" — NOT a specific
    // product. The specific product being considered lives on each
    // option (e.g. "SIMOND MT500 Blue"), since that's what actually
    // becomes the GearItem's name once purchased.
    name: { type: String, required: true, trim: true, maxlength: 150 },
    category: {
      // Same category list as GearItem — kept as an independent literal
      // here rather than importing GearItem's, matching how gearItemSchema
      // and gearValidators.js already each keep their own copy of this
      // list rather than sharing one; not a new inconsistency.
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
    estimatedBudgetDzd: { type: Number, min: 0, default: null },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },

    options: [gearWishlistOptionSchema],

    // Mirrors PlannedActivity's own status/completedActivityId pattern
    // exactly (docs/02_TECHNICAL_ARCHITECTURE.md §17): the wishlist item
    // stays in the database after purchase — as a record of the decision
    // made — rather than being deleted, the same way a completed
    // PlannedActivity remains visible rather than vanishing once its
    // Activity exists.
    isPurchased: { type: Boolean, default: false },
    purchasedOptionId: { type: mongoose.Schema.Types.ObjectId, default: null },
    purchasedGearItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'GearItem', default: null },
  },
  { timestamps: true }
)

gearWishlistItemSchema.index({ userId: 1, isPurchased: 1 })

export const GearWishlistItem = mongoose.model('GearWishlistItem', gearWishlistItemSchema)
