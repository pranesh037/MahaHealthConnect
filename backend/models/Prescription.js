import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  prescription_id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true },
  patient_name: { type: String },
  doctor_id: { type: String },
  doctor_name: { type: String },
  facility_name: { type: String },
  diagnosis: { type: String },
  items: [{ type: mongoose.Schema.Types.Mixed }],
  instructions: { type: String },
  status: { type: String, default: 'ACTIVE' },
  adherence_summary: { type: String },
  date: { type: String },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const Prescription = mongoose.models.Prescription || mongoose.model('Prescription', prescriptionSchema);
