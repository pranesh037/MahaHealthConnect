import mongoose from 'mongoose';

const bedSchema = new mongoose.Schema({
  facility_id: { type: String, required: true, unique: true },
  total_beds: { type: Number, default: 0 },
  occupied_beds: { type: Number, default: 0 },
  available_beds: { type: Number, default: 0 },
  icu_beds: { type: Number, default: 0 },
  available_icu_beds: { type: Number, default: 0 },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: false });

export const Bed = mongoose.models.Bed || mongoose.model('Bed', bedSchema);
