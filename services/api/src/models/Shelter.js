import mongoose from 'mongoose';

const shelterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    proCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  },
  { timestamps: true },
);

export const Shelter = mongoose.model('Shelter', shelterSchema);
