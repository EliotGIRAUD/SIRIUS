import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['adopter', 'shelter'], required: true },
    displayName: { type: String, required: true, trim: true },
    pseudo: { type: String, trim: true, default: null },
    shelterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', default: null },
    codeAuth: { type: String, default: null, trim: true },
    ownedShelterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', default: null },
    emailVerified: { type: Boolean, default: false },
    emailVerifyCode: { type: String, default: null },
    onboardingCompleted: { type: Boolean, default: false },
    rgpdAcceptedAt: { type: Date, default: null },
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
