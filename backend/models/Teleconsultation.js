import mongoose from 'mongoose';

const teleconsultationSchema = new mongoose.Schema({
  teleconsultation_id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true },
  doctor_id: { type: String, required: true },
  requested_by: { type: String, required: true },
  facility_id: { type: String },
  scheduled_at: { type: String, default: () => new Date().toISOString() },
  reason: { type: String },
  status: {
    type: String,
    enum: ['REQUESTED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'REQUESTED'
  },
  room_id: { type: String },
  meeting_link: { type: String },
  notes: { type: String },
  created_at: { type: String, default: () => new Date().toISOString() },
  updated_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const Teleconsultation = mongoose.models.Teleconsultation || mongoose.model('Teleconsultation', teleconsultationSchema);
