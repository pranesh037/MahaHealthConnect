import mongoose from 'mongoose';

const triageSchema = new mongoose.Schema({
  triage_id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true },
  health_worker_id: { type: String, required: true },
  facility_id: { type: String },
  priority: { type: String, default: 'ROUTINE' },
  indicators: [{ type: String }],
  vitals: { type: mongoose.Schema.Types.Mixed, default: {} },
  reason: { type: String },
  sync_status: { type: String, default: 'SYNCED' },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const Triage = mongoose.models.Triage || mongoose.model('Triage', triageSchema);
