import mongoose from 'mongoose';

const emergencyEscalationSchema = new mongoose.Schema({
  escalation_id: { type: String, required: true, unique: true },
  triage_id: { type: String },
  patient_id: { type: String, required: true },
  patient_name: { type: String },
  source_facility_id: { type: String, required: true },
  target_facility_id: { type: String, required: true },
  target_doctor_id: { type: String },
  reason: { type: String, required: true },
  priority: { type: String, default: 'EMERGENCY' },
  status: {
    type: String,
    enum: ['EMERGENCY', 'ESCALATED', 'ACCEPTED', 'RESOLVED'],
    default: 'EMERGENCY'
  },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const EmergencyEscalation = mongoose.models.EmergencyEscalation || mongoose.model('EmergencyEscalation', emergencyEscalationSchema);
