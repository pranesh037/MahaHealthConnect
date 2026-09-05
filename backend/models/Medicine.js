import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  medicine_id: { type: String, required: true, unique: true },
  facility_id: { type: String },
  name: { type: String, required: true },
  category: { type: String },
  current_stock: { type: Number, default: 0 },
  min_safety_stock: { type: Number, default: 0 },
  daily_consumption: { type: Number, default: 0 },
  status: { type: String, default: 'AVAILABLE' },
  last_updated: { type: String },
  dispensed_today: { type: Number, default: 0 },
  unit: { type: String, default: 'tablets' },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: false });

export const Medicine = mongoose.models.Medicine || mongoose.model('Medicine', medicineSchema);
