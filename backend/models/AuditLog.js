import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  user_id: { type: String },
  user_name: { type: String },
  role: { type: String },
  action: { type: String, required: true },
  patient_id: { type: String },
  facility_id: { type: String },
  result: { type: String, required: true },
  reason: { type: String },
  access_grant: { type: String },
  timestamp: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
