import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true },
  role: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  status: { type: String, default: 'ACTIVE' },
  name_mr: { type: String },
  designation: { type: String },
  facility_id: { type: String },
  facility_name: { type: String },
  patient_id: { type: String },
  district: { type: String },
  dob: { type: String },
  gender: { type: String },
  address: { type: String },
  village: { type: String },
  blood_group: { type: String },
  employee_id: { type: String },
  worker_type: { type: String },
  assigned_villages: [{ type: String }],
  qualification: { type: String },
  specialty: { type: String },
  license_no: { type: String },
  jurisdiction: { type: String },
  passwordHash: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
}, { timestamps: false });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
