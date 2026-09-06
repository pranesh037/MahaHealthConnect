import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  referral_id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true },
  patient_name: { type: String },
  age: { type: Number },
  referring_facility_id: { type: String },
  referring_facility_name: { type: String },
  referring_worker: { type: String },
  target_facility_id: { type: String },
  target_facility_name: { type: String },
  destination_facility_id: { type: String },
  destination_facility_name: { type: String },
  target_doctor_id: { type: String },
  target_doctor_name: { type: String },
  specialty_required: { type: String },
  clinical_notes: { type: String },
  priority: { type: String },
  status: { type: String, default: 'SENT' },
  accepted_hospital: { type: String },
  accepted_facility_id: { type: String },
  accepted_facility_name: { type: String },
  accepted_by: { type: String },
  accepted_by_name: { type: String },
  accepted_at: { type: String },
  rejected_by: { type: String },
  rejected_at: { type: String },
  decision_reason: { type: String },
  target_hospitals: [{ type: mongoose.Schema.Types.Mixed }],
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const Referral = mongoose.models.Referral || mongoose.model('Referral', referralSchema);
