import mongoose from 'mongoose';

const equipmentSchema = new mongoose.Schema({
  equipment_id: { type: String, required: true, unique: true },
  facility_id: { type: String, required: true },
  name: { type: String, required: true },
  available_quantity: { type: Number, default: 0 },
  status: { type: String, default: 'AVAILABLE' },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: false });

export const Equipment = mongoose.models.Equipment || mongoose.model('Equipment', equipmentSchema);
