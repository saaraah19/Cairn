import mongoose from 'mongoose'

// See docs/05_DATA_MODEL_AND_API_CONTRACT.md §4-5.
// passwordHash is optional at the schema level because Google-only accounts
// (Phase 1b) never set one. Email/password registration enforces its
// presence in authService.registerUser instead.
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      default: null,
    },
    googleId: {
      type: String,
      default: null,
      unique: true,
      sparse: true, // allows many docs with googleId: null
    },
    authProviders: {
      type: [String],
      default: ['password'],
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      defaultActivityVisibility: {
        type: String,
        enum: ['private', 'public'],
        default: 'private',
      },
    },
  },
  { timestamps: true }
)

// Never expose passwordHash through API responses (docs/02_TECHNICAL_ARCHITECTURE.md §6).
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash
    return ret
  },
})

export const User = mongoose.model('User', userSchema)
