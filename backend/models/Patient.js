import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  patient_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number },
  gender: { type: String },
  dob: { type: String },
  phone: { type: String },
  address: { type: String },
  village: { type: String },
  taluka: { type: String },
  district: { type: String },
  nfc_token: { type: String },
  vitals: { type: mongoose.Schema.Types.Mixed, default: {} },
  triage_status: { type: String, default: 'NORMAL' },
  triage_reason: { type: String },
  is_maternal: { type: Boolean, default: false },
  registered_facility_id: { type: String },
  registered_by: { type: String },
  registered_at: { type: String },
  record_version: { type: Number, default: 1 },
  updated_at: { type: Date, default: Date.now },
  medical_info: { type: mongoose.Schema.Types.Mixed }
}, { timestamps: false });

export const Patient = mongoose.models.Patient || mongoose.model('Patient', patientSchema);
