import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    proCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    subscriptionStatus: { type: String, enum: ['inactive', 'active'], default: 'inactive' },
    subscriptionPlan: { type: String, default: null },
    subscriptionValidUntil: { type: Date, default: null },
    features: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const Shelter = mongoose.model('Shelter', shelterSchema);
