import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  attendance_id: { type: String, required: true, unique: true },
  user_id: { type: String, required: true },
  user_name: { type: String },
  role: { type: String, required: true },
  facility_id: { type: String, required: true },
  date: { type: String, required: true },
  check_in: { type: String },
  check_out: { type: String },
  status: { type: String, enum: ['PRESENT', 'COMPLETED'], default: 'PRESENT' },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
