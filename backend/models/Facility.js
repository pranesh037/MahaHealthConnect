import mongoose from 'mongoose';

const facilitySchema = new mongoose.Schema({
  facility_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String },
  district: { type: String, required: true },
  taluka: { type: String },
  address: { type: String },
  contact: { type: String },
  doctor_count: { type: Number, default: 0 },
  active_beds: { type: Number, default: 0 },
  available_beds: { type: Number, default: 0 },
  occupied_beds: { type: Number, default: 0 },
  icu_beds: { type: Number, default: 0 },
  available_icu_beds: { type: Number, default: 0 },
  distance_km: { type: String },
  last_verified: { type: String, default: 'Just now' },
  status: { type: String, default: 'AVAILABLE' },
  latitude: { type: Number },
  longitude: { type: Number },
  specialties: [{ type: String }]
}, { timestamps: false });

export const Facility = mongoose.models.Facility || mongoose.model('Facility', facilitySchema);
