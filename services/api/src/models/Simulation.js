import mongoose from 'mongoose';

const gaugesSchema = new mongoose.Schema(
  {
    hunger: { type: Number, default: 80, min: 0, max: 100 },
    energy: { type: Number, default: 80, min: 0, max: 100 },
    hygiene: { type: Number, default: 80, min: 0, max: 100 },
    mental: { type: Number, default: 80, min: 0, max: 100 },
  },
  { _id: false },
);

const simulationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dog', default: null },
    status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
    currentDay: { type: Number, default: 1, min: 1, max: 30 },
    budgetRemaining: { type: Number, required: true },
    initialBudget: { type: Number, required: true },
    gauges: { type: gaugesSchema, default: () => ({}) },
    finalScore: { type: Number, default: 100, min: 0, max: 100 },
    vitalSpent: { type: Number, default: 0 },
    superfluousSpent: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    purchasedVitalItems: { type: [String], default: [] },
    validatedByShelter: { type: Boolean, default: false },
    validatedAt: { type: Date, default: null },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

simulationSchema.index({ userId: 1, status: 1 });

export const Simulation = mongoose.model('Simulation', simulationSchema);
