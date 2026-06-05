import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema(
  {
    lat: Number,
    lng: Number,
    timestamp: Date,
  },
  { _id: false },
);

const walkSessionSchema = new mongoose.Schema(
  {
    simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date, default: null },
    points: { type: [pointSchema], default: [] },
    distanceMeters: { type: Number, default: 0 },
    durationMinutes: { type: Number, default: 0 },
    validated: { type: Boolean, default: false },
    cheatFlags: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const WalkSession = mongoose.model('WalkSession', walkSessionSchema);
