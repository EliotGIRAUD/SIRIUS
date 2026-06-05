import mongoose from 'mongoose';

const attestationSchema = new mongoose.Schema(
  {
    simulationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Simulation', required: true, unique: true },
    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    validatedAt: { type: Date, default: Date.now },
    pdfPath: { type: String, default: null },
  },
  { timestamps: true },
);

export const Attestation = mongoose.model('Attestation', attestationSchema);
