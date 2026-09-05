import mongoose from 'mongoose';

const diagnosticOrderSchema = new mongoose.Schema({
  order_id: { type: String, required: true, unique: true },
  patient_id: { type: String, required: true },
  doctor_id: { type: String, required: true },
  test_name: { type: String, required: true },
  status: { type: String, default: 'ORDERED' },
  result: { type: String },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const DiagnosticOrder = mongoose.models.DiagnosticOrder || mongoose.model('DiagnosticOrder', diagnosticOrderSchema);
