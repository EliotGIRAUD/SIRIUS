import mongoose from 'mongoose';

const sponsorCampaignSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    tier: { type: String, enum: ['starter', 'standard', 'premium', 'exclusive'], required: true },
    status: { type: String, enum: ['inactive', 'active'], default: 'inactive' },
    impressionsLimit: { type: Number, default: 5000 },
    impressionsCount: { type: Number, default: 0 },
    validUntil: { type: Date, default: null },
    placement: { type: String, default: 'map' },
  },
  { timestamps: true },
);

export const SponsorCampaign = mongoose.model('SponsorCampaign', sponsorCampaignSchema);
