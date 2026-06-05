import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, required: true },
    partnerType: { type: String, enum: ['shelter', 'breeder', 'sponsor'], required: true },
    planId: { type: String, required: true },
    status: { type: String, enum: ['active', 'cancelled', 'expired'], default: 'active' },
    validUntil: { type: Date, required: true },
    mockPayment: { type: Boolean, default: true },
    amountEur: { type: Number, default: 0 },
  },
  { timestamps: true },
);

subscriptionSchema.index({ partnerId: 1, partnerType: 1 });

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
