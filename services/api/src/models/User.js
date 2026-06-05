import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['b2c', 'b2b'], default: 'b2c' },
    productId: { type: String, required: true },
    purchasedAt: { type: Date, default: Date.now },
    mock: { type: Boolean, default: true },
    amountEur: { type: Number, default: 0 },
  },
  { _id: false },
);

const badgeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['adopter', 'shelter', 'breeder', 'sponsor'], required: true },
    displayName: { type: String, required: true, trim: true },
    pseudo: { type: String, trim: true, default: null },
    shelterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', default: null },
    codeAuth: { type: String, default: null, trim: true },
    ownedShelterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', default: null },
    breederId: { type: mongoose.Schema.Types.ObjectId, ref: 'Breeder', default: null },
    emailVerified: { type: Boolean, default: false },
    emailVerifyCode: { type: String, default: null },
    onboardingCompleted: { type: Boolean, default: false },
    rgpdAcceptedAt: { type: Date, default: null },
    plan: { type: String, enum: ['free', 'premium'], default: 'free' },
    ownedBreeds: { type: [String], default: ['labrador'] },
    purchases: { type: [purchaseSchema], default: [] },
    badges: { type: [badgeSchema], default: [] },
    settings: {
      soundsEnabled: { type: Boolean, default: true },
      hapticsEnabled: { type: Boolean, default: true },
      notificationsEnabled: { type: Boolean, default: false },
      gpsEnabled: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

userSchema.index({ shelterId: 1 });

export const User = mongoose.model('User', userSchema);
