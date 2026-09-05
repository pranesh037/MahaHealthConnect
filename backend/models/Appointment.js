import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  appointment_id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true },
  patient_name: { type: String },
  doctor_id: { type: String, required: true },
  doctor_name: { type: String },
  facility_id: { type: String },
  facility_name: { type: String },
  date: { type: String, required: true },
  time: { type: String, required: true },
  type: { type: String },
  status: { type: String, default: 'BOOKED' },
  token_number: { type: String },
  triage_priority: { type: String },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
