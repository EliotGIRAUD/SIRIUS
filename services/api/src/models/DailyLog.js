import mongoose from 'mongoose';

const actionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'meal',
        'water',
        'walk',
        'mental_stimulation',
        'brush',
        'antiparasitic',
        'shop_purchase',
        'vet_care',
        'play',
        'affection',
      ],
      required: true,
    },
    timestamp: { type: Date, required: true },
    cost: { type: Number, default: 0 },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const penaltyBonusSchema = new mongoose.Schema(
  {
    code: { type: String, required: true },
    message: { type: String, required: true },
    points: { type: Number, required: true },
  },
  { _id: false },
);

const dailyLogSchema = new mongoose.Schema(
  {
    simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation', required: true },
    dayNumber: { type: Number, required: true, min: 1, max: 30 },
    actions: { type: [actionSchema], default: [] },
    dayScore: { type: Number, default: null },
    penalties: { type: [penaltyBonusSchema], default: [] },
    bonuses: { type: [penaltyBonusSchema], default: [] },
    closedAt: { type: Date, default: null },
    budgetEvents: {
      type: [{
        label: String,
        amount: Number,
        appliedAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
    weeklyChallenge: {
      id: String,
      title: String,
      completed: { type: Boolean, default: false },
      rewardBadgeId: String,
    },
  },
  { timestamps: true },
);

dailyLogSchema.index({ simulationId: 1, dayNumber: 1 }, { unique: true });

export const DailyLog = mongoose.model('DailyLog', dailyLogSchema);
