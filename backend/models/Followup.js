import mongoose from 'mongoose';

const followupSchema = new mongoose.Schema({
  followup_id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true },
  doctor_id: { type: String },
  facility_id: { type: String },
  followup_date: { type: String, required: true },
  reason: { type: String },
  status: { type: String, default: 'SCHEDULED' },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const Followup = mongoose.models.Followup || mongoose.model('Followup', followupSchema);
