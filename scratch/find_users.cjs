const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });
if (!process.env.MONGODB_URI) require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const User = mongoose.model('User', new mongoose.Schema({ user_id: String, username: String, role: String, facility_id: String }), 'users');
  const hw = await User.find({ role: 'health_worker' }).limit(5).lean();
  const doc = await User.find({ role: 'doctor' }).limit(5).lean();
  console.log('HW USERS:', hw.map(u => ({ user_id: u.user_id, username: u.username, role: u.role, facility: u.facility_id })));
  console.log('DOC USERS:', doc.map(u => ({ user_id: u.user_id, username: u.username, role: u.role, facility: u.facility_id })));
  process.exit(0);
}).catch(err => { console.error(err); process.exit(1); });
