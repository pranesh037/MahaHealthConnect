import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  notification_id: { type: String, required: true, unique: true },
  recipient_id: { type: String, required: true, index: true },
  recipient_user_id: { type: String, index: true },
  recipient_role: { type: String },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, default: 'INFO' },
  related_entity_type: { type: String },
  related_entity_id: { type: String },
  link: { type: String },
  read: { type: Boolean, default: false },
  created_at: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false });

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
