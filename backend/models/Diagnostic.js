import mongoose from 'mongoose';

const diagnosticSchema = new mongoose.Schema({
  test_id: { type: String, required: true, unique: true },
  facility_id: { type: String, required: true },
  name: { type: String, required: true },
  category: { type: String },
  status: { type: String, default: 'AVAILABLE' },
  daily_capacity: { type: Number, default: 0 },
  completed_today: { type: Number, default: 0 },
  remaining_capacity: { type: Number, default: 0 },
  turnaround_hours: { type: Number, default: 1 }
}, { timestamps: false });

export const Diagnostic = mongoose.models.Diagnostic || mongoose.model('Diagnostic', diagnosticSchema);
