import mongoose from 'mongoose';

const dogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation', default: null },
    breedId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    sccLetter: { type: String, default: null, trim: true },
    moralContractSignedAt: { type: Date, default: null },
    abandonmentProtocolCompleted: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

dogSchema.index({ userId: 1, active: 1 });

export const Dog = mongoose.model('Dog', dogSchema);
