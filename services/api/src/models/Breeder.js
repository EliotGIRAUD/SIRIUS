import mongoose from 'mongoose';

const breederSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    breeds: { type: [String], default: [] },
    lat: { type: Number, default: 48.87 },
    lng: { type: Number, default: 2.33 },
    verified: { type: Boolean, default: false },
    subscriptionStatus: { type: String, enum: ['inactive', 'active'], default: 'inactive' },
    subscriptionValidUntil: { type: Date, default: null },
    monthlyViews: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Breeder = mongoose.model('Breeder', breederSchema);
