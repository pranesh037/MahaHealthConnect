import mongoose from 'mongoose';

const consultationSchema = new mongoose.Schema({
  consultation_id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true },
  doctor_id: { type: String, required: true },
  facility_id: { type: String },
  complaint: { type: String },
  observations: { type: String },
  diagnosis: { type: String },
  notes: { type: String },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const Consultation = mongoose.models.Consultation || mongoose.model('Consultation', consultationSchema);
