import mongoose from 'mongoose';

const authCodeSchema = new mongoose.Schema(
  {
    shelterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shelter', required: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    usedAt: { type: Date, default: null },
    multiUse: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const AuthCode = mongoose.model('AuthCode', authCodeSchema);
