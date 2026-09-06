import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { databaseConfigured, databaseHealth, initializeDatabase, closeDatabase } from './database.js';
import { seedDatabase } from './seed.js';
import {
  User,
  Patient,
  Facility,
  Appointment,
  Triage,
  Referral,
  Prescription,
  Diagnostic,
  DiagnosticOrder,
  Followup,
  Medicine,
  Equipment,
  Bed,
  AuditLog,
  Consultation,
  AccessGrant,
  Teleconsultation,
  Attendance,
  Notification,
  EmergencyEscalation
} from './models/index.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'maha-health-connect-demo-secret';

const createTargetedNotification = async ({ recipient_id, recipient_user_id, recipient_role, title, message, type = 'INFO', related_entity_type, related_entity_id, link = '' }) => {
  try {
    const targetUserId = recipient_user_id || recipient_id;
    await Notification.create({
      notification_id: `NOT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipient_id: targetUserId,
      recipient_user_id: targetUserId,
      recipient_role,
      title,
      message,
      type,
      related_entity_type,
      related_entity_id,
      link,
      read: false,
      created_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};


app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));

const calculateAge = (dob, age) => {
  if (dob) {
    const birthDate = new Date(dob);
    if (!isNaN(birthDate.getTime())) {
      const today = new Date();
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      if (calculatedAge >= 0) return calculatedAge;
    }
  }
  if (age !== undefined && age !== null && age !== '') {
    const numAge = Number(age);
    if (!isNaN(numAge) && numAge >= 0) return numAge;
  }
  return null;
};

const sanitizeDoc = (doc) => {
  if (!doc) return doc;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  if (obj.dob || obj.date_of_birth || obj.age !== undefined) {
    const computedAge = calculateAge(obj.dob || obj.date_of_birth, obj.age);
    if (computedAge !== null) obj.age = computedAge;
  }
  return obj;
};

const sanitizeArray = (arr) => (Array.isArray(arr) ? arr.map(sanitizeDoc) : []);

const publicUser = (user) => {
  const obj = sanitizeDoc(user);
  if (obj) delete obj.passwordHash;
  return obj;
};

const signToken = (user) => jwt.sign({ sub: user.user_id, role: user.role }, jwtSecret, { expiresIn: '8h' });

const audit = async (user, action, result, patientId = null, reason = '') => {
  try {
    await AuditLog.create({
      id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: user?.user_id || 'anonymous',
      user_name: user?.name || 'Anonymous',
      role: user?.role || 'unknown',
      action,
      result,
      patient_id: patientId,
      facility_id: user?.facility_id || null,
      reason,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Audit logging failed:', error.message);
  }
};

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = await User.findOne({ user_id: payload.sub }).lean();
    if (!user) throw new Error('Unknown user');
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
};

const allow = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    audit(req.user, `${req.method} ${req.path}`, 'DENIED', req.params.patientId, 'Role is not permitted');
    return res.status(403).json({ error: 'You are not authorized for this action' });
  }
  next();
};

const findPatient = async (id) => await Patient.findOne({ patient_id: id }).lean();

const canAccessPatient = async (user, patient, clinical = false) => {
  if (!patient) return false;
  if (user.role === 'patient') return user.patient_id === patient.patient_id;
  if (user.role === 'health_worker') return (!clinical && (!user.facility_id || user.facility_id === (patient.registered_facility_id || 'FAC-101'))) || (clinical && user.facility_id === (patient.registered_facility_id || 'FAC-101'));
  if (user.role === 'doctor') {
    const now = new Date();

    const grant = await AccessGrant.findOne({
      patient_id: patient.patient_id,
      doctor_id: user.user_id,
      status: 'ACTIVE',
      starts_at: { $lte: now },
      expires_at: { $gt: now }
    }).lean();
    if (grant) return true;

    const appointment = await Appointment.findOne({
      patient_id: patient.patient_id,
      doctor_id: user.user_id,
      status: { $in: ['BOOKED', 'REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] }
    }).lean();

    if (appointment) return true;

    const tele = await Teleconsultation.findOne({
      patient_id: patient.patient_id,
      doctor_id: user.user_id,
      status: { $in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] }
    }).lean();
    if (tele) return true;

    const referral = await Referral.findOne({
      patient_id: patient.patient_id,
      $or: [
        { accepted_doctor_id: user.user_id },
        { target_doctor_id: user.user_id },
        { target_facility_id: user.facility_id }
      ],
      status: { $in: ['ACCEPTED', 'ACTIVE', 'COMPLETED'] }
    }).lean();
    if (referral) return true;

    return false;
  }
  return user.role === 'facility_admin' ? user.facility_id === patient.registered_facility_id : false;
};


app.get('/api/health', async (_req, res) => {
  const health = await databaseHealth();
  res.json({ status: 'ok', service: 'Maha Health Connect API', persistence: health });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password, role } = req.body || {};
  const searchStr = String(username || '').trim();
  const escapedStr = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  let user = null;
  if (role) {
    user = await User.findOne({
      role,
      $or: [
        { user_id: searchStr },
        { patient_id: searchStr },
        { phone: searchStr },
        { email: searchStr.toLowerCase() },
        { employee_id: searchStr },
        { name: new RegExp(`^${escapedStr}$`, 'i') }
      ]
    }).lean();
  }

  if (!user) {
    user = await User.findOne({
      $or: [
        { user_id: searchStr },
        { patient_id: searchStr },
        { phone: searchStr },
        { email: searchStr.toLowerCase() },
        { employee_id: searchStr },
        { name: new RegExp(`^${escapedStr}$`, 'i') }
      ]
    }).lean();
  }

  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
    await audit(null, 'LOGIN', 'DENIED', null, 'Invalid credentials');
    return res.status(401).json({ error: 'Invalid username, password, or role' });
  }

  if (user.status && user.status === 'SUSPENDED') {
    await audit(user, 'LOGIN', 'DENIED', null, 'Account suspended');
    return res.status(403).json({ error: 'Your account is suspended. Please contact administrator.' });
  }

  await audit(user, 'LOGIN', 'AUTHORIZED');
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      role,
      name,
      phone,
      email,
      password,
      dob,
      gender,
      address,
      village,
      district,
      blood_group,
      employee_id,
      facility_id,
      facility_name,
      worker_type,
      specialty,
      license_no,
      designation
    } = req.body || {};

    const validRoles = ['patient', 'health_worker', 'doctor', 'facility_admin', 'district_authority'];

    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Please select a valid role.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: 'Mobile number is required.' });
    }

    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const cleanPhone = phone.trim();
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanEmpId = employee_id ? employee_id.trim() : '';

    // Check duplicate phone/email/employee_id
    const duplicateQueries = [{ phone: cleanPhone }];
    if (cleanEmail) duplicateQueries.push({ email: cleanEmail });
    if (cleanEmpId) duplicateQueries.push({ employee_id: cleanEmpId });

    const existingUser = await User.findOne({ $or: duplicateQueries }).lean();
    if (existingUser) {
      if (existingUser.phone === cleanPhone) {
        return res.status(400).json({ error: 'An account with this mobile number already exists.' });
      }
      if (cleanEmail && existingUser.email === cleanEmail) {
        return res.status(400).json({ error: 'An account with this email address already exists.' });
      }
      if (cleanEmpId && existingUser.employee_id === cleanEmpId) {
        return res.status(400).json({ error: 'An account with this Employee ID already exists.' });
      }
      return res.status(400).json({ error: 'User registration conflict. Check your details.' });
    }

    // Generate unique user_id
    const randNum = Math.floor(100000 + Math.random() * 900000);
    const prefixMap = {
      patient: 'USR-PAT',
      health_worker: 'USR-HW',
      doctor: 'USR-DOC',
      facility_admin: 'USR-ADM',
      district_authority: 'USR-DHO'
    };
    const userId = `${prefixMap[role]}-${randNum}`;

    let patientId = null;
    if (role === 'patient') {
      patientId = `PAT-${Math.floor(10000 + Math.random() * 90000)}`;
      // Also seed a Patient document for full clinical & dashboard compatibility
      await Patient.create({
        patient_id: patientId,
        name: name.trim(),
        gender: gender || 'Other',
        dob: dob || '1990-01-01',
        phone: cleanPhone,
        address: address ? `${address}, ${village || ''}, ${district || ''}` : `${village || ''}, ${district || ''}`,
        village: village || 'General',
        district: district || 'Pune',
        blood_group: blood_group || undefined,
        registered_facility_id: facility_id || 'FAC-101',
        registered_by: userId,
        registered_at: new Date().toISOString(),
        triage_status: 'ROUTINE',
        triage_reason: 'Self Registered Citizen',
        medical_info: {
          blood_group: blood_group || undefined,
          allergies: [],
          conditions: []
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUserDoc = await User.create({
      user_id: userId,
      role,
      name: name.trim(),
      phone: cleanPhone,
      email: cleanEmail || undefined,
      status: 'ACTIVE',
      dob: dob || undefined,
      gender: gender || undefined,
      address: address || undefined,
      village: village || undefined,
      district: district || undefined,
      blood_group: blood_group || undefined,
      employee_id: cleanEmpId || undefined,
      worker_type: worker_type || undefined,
      specialty: specialty || undefined,
      license_no: license_no || undefined,
      designation: designation || (role === 'health_worker' ? (worker_type || 'ASHA Worker') : role === 'doctor' ? 'Specialist Doctor' : role === 'facility_admin' ? 'Facility Administrator' : role === 'district_authority' ? 'District Health Officer' : 'Citizen'),
      facility_id: facility_id || (role === 'doctor' ? 'FAC-103' : role === 'health_worker' ? 'FAC-101' : role === 'facility_admin' ? 'FAC-101' : undefined),
      facility_name: facility_name || (role === 'doctor' ? 'District Hospital Aundh' : role === 'health_worker' ? 'PHC Mulshi' : role === 'facility_admin' ? 'PHC Mulshi' : undefined),
      patient_id: patientId || undefined,
      passwordHash,
      created_at: new Date()
    });

    await audit(newUserDoc, 'REGISTER', 'AUTHORIZED');

    const safeUser = publicUser(newUserDoc);
    const token = signToken(newUserDoc);

    return res.status(201).json({ token, user: safeUser });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: error.message || 'Registration failed' });
  }
});

app.post('/api/auth/logout', authenticate, async (req, res) => {
  await audit(req.user, 'LOGOUT', 'AUTHORIZED');
  res.status(204).end();
});

app.get('/api/me', authenticate, (req, res) => res.json({ user: publicUser(req.user) }));
// ============================================================
// SECURE TIME-BOUND DOCTOR ACCESS
// ============================================================

app.get('/api/access-grants', authenticate, async (req, res) => {
  try {
    const filter = {};

    if (req.user.role === 'doctor') {
      filter.doctor_id = req.user.user_id;
    } else if (req.user.role === 'patient') {
      filter.patient_id = req.user.patient_id;
    } else if (req.user.role === 'health_worker') {
      filter.granted_by = req.user.user_id;
    }

    const grants = await AccessGrant.find(filter)
      .sort({ created_at: -1 })
      .lean();

    const now = new Date();

    const updatedGrants = await Promise.all(
      grants.map(async (grant) => {
        if (
          grant.status === 'ACTIVE' &&
          new Date(grant.expires_at) <= now
        ) {
          await AccessGrant.updateOne(
            { grant_id: grant.grant_id },
            { $set: { status: 'EXPIRED' } }
          );

          return {
            ...grant,
            status: 'EXPIRED'
          };
        }

        return grant;
      })
    );

    res.json({
      grants: sanitizeArray(updatedGrants)
    });
  } catch (error) {
    console.error('Access grant retrieval error:', error);

    res.status(500).json({
      error: 'Unable to load access grants'
    });
  }
});

app.post(
  '/api/access-grants',
  authenticate,
  allow('health_worker', 'doctor'),
  async (req, res) => {
    try {
      const {
        patient_id,
        doctor_id,
        duration_minutes = 60,
        reason = 'Authorized clinical consultation'
      } = req.body || {};

      if (!patient_id || !doctor_id) {
        return res.status(400).json({
          error: 'Patient ID and Doctor ID are required'
        });
      }

      const patient = await Patient.findOne({
        patient_id
      }).lean();

      if (!patient) {
        return res.status(404).json({
          error: 'Patient not found'
        });
      }

      const doctor = await User.findOne({
        user_id: doctor_id,
        role: 'doctor'
      }).lean();

      if (!doctor) {
        return res.status(404).json({
          error: 'Doctor not found'
        });
      }

      if (
        req.user.role === 'health_worker' &&
        req.user.facility_id &&
        patient.registered_facility_id !== req.user.facility_id
      ) {
        return res.status(403).json({
          error: 'Patient is outside your facility scope'
        });
      }

      const minutes = Math.min(
        Math.max(Number(duration_minutes) || 60, 5),
        240
      );

      const startsAt = new Date();

      const expiresAt = new Date(
        startsAt.getTime() + minutes * 60 * 1000
      );

      const grant = await AccessGrant.create({
        grant_id: `GRANT-${Date.now().toString().slice(-8)}`,
        patient_id,
        doctor_id,
        doctor_name: doctor.name,
        facility_id: doctor.facility_id || '',
        facility_name: doctor.facility_name || '',
        granted_by: req.user.user_id,
        granted_by_name: req.user.name || '',
        reason,
        access_type: 'CLINICAL_FULL',
        starts_at: startsAt,
        expires_at: expiresAt,
        status: 'ACTIVE',
        created_at: startsAt
      });

      await audit(
        req.user,
        'TIME_BOUND_ACCESS_GRANTED',
        'AUTHORIZED',
        patient_id,
        `Doctor ${doctor_id}; expires ${expiresAt.toISOString()}`
      );

      res.status(201).json({
        grant: sanitizeDoc(grant)
      });
    } catch (error) {
      console.error('Access grant creation error:', error);

      res.status(500).json({
        error: 'Unable to create access grant'
      });
    }
  }
);

app.patch('/api/access-grants/:id/revoke', authenticate, allow('health_worker', 'doctor', 'facility_admin'), async (req, res) => {
  try {
    const grantId = req.params.id;
    const grant = await AccessGrant.findOne({ grant_id: grantId });
    if (!grant) {
      return res.status(404).json({ error: 'Access grant not found' });
    }

    grant.status = 'REVOKED';
    await grant.save();

    await audit(
      req.user,
      'TIME_BOUND_ACCESS_REVOKED',
      'AUTHORIZED',
      grant.patient_id,
      `Access grant ${grantId} revoked for doctor ${grant.doctor_id}`
    );

    res.json({ grant: sanitizeDoc(grant) });
  } catch (error) {
    console.error('Access grant revocation error:', error);
    res.status(500).json({ error: 'Unable to revoke access grant' });
  }
});


app.get('/api/patients', authenticate, async (req, res) => {
  const query = String(req.query.q || '').toLowerCase();
  let accessiblePatients = [];

  if (req.user.role === 'doctor') {
    const now = new Date();
    const activeGrants = await AccessGrant.find({
      doctor_id: req.user.user_id,
      status: 'ACTIVE',
      starts_at: { $lte: now },
      expires_at: { $gt: now }
    }).lean();

    const authorizedPatientIds = activeGrants.map((g) => g.patient_id);
    const allAuthorizedPatients = await Patient.find({
      patient_id: { $in: authorizedPatientIds }
    }).lean();

    accessiblePatients = allAuthorizedPatients.filter((p) => {
      if (!query) return true;
      return [p.patient_id, p.name, p.phone].some((val) =>
        String(val || '').toLowerCase().includes(query)
      );
    });
  } else {
    const allPatients = await Patient.find().lean();
    for (const patient of allPatients) {
      if (
        req.user.role === 'health_worker' ||
        await canAccessPatient(req.user, patient)
      ) {
        if (
          !query ||
          [patient.patient_id, patient.name, patient.phone]
            .some((val) =>
              String(val || '').toLowerCase().includes(query)
            )
        ) {
          accessiblePatients.push(patient);
        }
      }
    }
  }

  await audit(req.user, 'PATIENT_SEARCH', 'AUTHORIZED');
  res.json({
    patients: accessiblePatients.map((patient) => {
      const clean = sanitizeDoc(patient);
      clean.blood_group = patient.blood_group || patient.medical_info?.blood_group || undefined;
      return clean;
    })
  });
});

app.post('/api/patients', authenticate, allow('health_worker'), async (req, res) => {
  const payload = req.body || {};
  const cleanPhone = String(payload.phone || '').replace(/\D/g, '');

  if (cleanPhone) {
    const existingPatients = await Patient.find().lean();
    const duplicate = existingPatients.find((p) => String(p.phone || '').replace(/\D/g, '').endsWith(cleanPhone));
    if (duplicate) {
      return res.status(409).json({ error: 'A patient with this phone number already exists', patient: sanitizeDoc(duplicate) });
    }
  }

  const patientCount = await Patient.countDocuments();
  const patient_id = `PAT-MH-${String(patientCount + 128).padStart(6, '0')}`;
  const bloodGroup = payload.blood_group || payload.medical_info?.blood_group || undefined;
  const patientData = {
    ...payload,
    patient_id,
    blood_group: bloodGroup,
    registered_facility_id: req.user.facility_id || 'FAC-101',
    registered_by: req.user.name,
    registered_at: new Date().toISOString(),
    record_version: 1,
    medical_info: {
      blood_group: bloodGroup,
      allergies: payload.allergies || payload.medical_info?.allergies || [],
      conditions: payload.conditions || payload.medical_info?.conditions || []
    }
  };

  const patient = await Patient.create(patientData);
  await audit(req.user, 'PATIENT_REGISTRATION', 'AUTHORIZED', patient_id);
  res.status(201).json({ patient: sanitizeDoc(patient) });
});

app.get('/api/patients/:patientId/health-record', authenticate, async (req, res) => {
  const patient = await findPatient(req.params.patientId);
  if (!patient) return res.status(404).json({ error: 'Patient record not found' });

  const authorized = await canAccessPatient(req.user, patient, true);
  if (!authorized) {
    await audit(req.user, 'HEALTH_RECORD_ACCESS', 'DENIED', req.params.patientId, 'Unauthorized access attempt');
    return res.status(403).json({ error: 'Not authorized to view clinical record' });
  }

  const [triages, appointments, consultations, prescriptions, diagnostics, referrals, followups] = await Promise.all([
    Triage.find({ patient_id: req.params.patientId }).sort({ created_at: -1 }).lean(),
    Appointment.find({ patient_id: req.params.patientId }).sort({ date: -1 }).lean(),
    Consultation.find({ patient_id: req.params.patientId }).sort({ created_at: -1 }).lean(),
    Prescription.find({ patient_id: req.params.patientId }).sort({ created_at: -1 }).lean(),
    DiagnosticOrder.find({ patient_id: req.params.patientId }).sort({ created_at: -1 }).lean(),
    Referral.find({ patient_id: req.params.patientId }).sort({ created_at: -1 }).lean(),
    Followup.find({ patient_id: req.params.patientId }).sort({ created_at: -1 }).lean()
  ]);

  const fhirRecord = {
    resourceType: 'Bundle',
    type: 'document',
    timestamp: new Date().toISOString(),
    patient: {
      patient_id: patient.patient_id,
      name: patient.name,
      dob: patient.dob,
      gender: patient.gender,
      blood_group: patient.blood_group,
      phone: patient.phone,
      address: patient.address,
      village: patient.village,
      district: patient.district,
      conditions: patient.conditions || [],
      allergies: patient.allergies || []
    },
    observations: sanitizeArray(triages).map(t => ({
      type: 'Vitals',
      vitals: t.vitals || { temperature: t.temperature, spo2: t.oxygen_saturation, pulse: t.heart_rate },
      symptoms: t.symptoms,
      priority: t.triage_priority || t.priority,
      recorded_at: t.created_at
    })),
    encounters: sanitizeArray(consultations).map(c => ({
      consultation_id: c.consultation_id,
      doctor_id: c.doctor_id,
      complaint: c.complaint,
      diagnosis: c.diagnosis,
      notes: c.notes,
      date: c.created_at
    })),
    medications: sanitizeArray(prescriptions),
    diagnosticReports: sanitizeArray(diagnostics),
    carePlans: {
      referrals: sanitizeArray(referrals),
      followups: sanitizeArray(followups),
      appointments: sanitizeArray(appointments)
    }
  };

  await audit(req.user, 'HEALTH_RECORD_EXPORT', 'AUTHORIZED', req.params.patientId);
  res.json({ healthRecord: fhirRecord });
});

app.get('/api/patients/:patientId', authenticate, async (req, res) => {
  const patient = await findPatient(req.params.patientId);
  const clinical = req.query.dataType === 'CLINICAL_FULL';

  if (!patient || !(await canAccessPatient(req.user, patient, clinical))) {
    await audit(req.user, 'RECORD_ACCESS', 'DENIED', req.params.patientId, 'No active care relationship');
    return res.status(403).json({ error: 'Patient record access denied' });
  }

  await audit(req.user, 'RECORD_ACCESS', 'AUTHORIZED', patient.patient_id, clinical ? 'Clinical access window verified' : 'Operational access');
  res.json({ patient: sanitizeDoc(patient) });
});

app.get('/api/patients/me/dashboard', authenticate, async (req, res) => {
  try {
    let patientId = req.user.patient_id || req.user.user_id;

    let patient = await Patient.findOne({
      $or: [
        { patient_id: patientId },
        { patient_id: req.user.user_id },
        { phone: req.user.phone }
      ]
    }).lean();

    if (!patient && req.user.role === 'patient') {
      patient = {
        patient_id: patientId,
        name: req.user.name,
        dob: req.user.dob || '1995-01-01',
        gender: req.user.gender || 'Other',
        phone: req.user.phone,
        address: req.user.address || 'Maharashtra',
        village: req.user.village || 'General',
        district: req.user.district || 'Pune',
        blood_group: req.user.blood_group,
        registered_facility_id: req.user.facility_id || 'FAC-101',
        registered_facility_name: req.user.facility_name || 'Primary Health Centre',
        medical_info: {
          blood_group: req.user.blood_group,
          allergies: [],
          conditions: []
        }
      };
    }

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const pId = patient.patient_id;
    const bloodGroup = patient.blood_group || patient.medical_info?.blood_group || req.user.blood_group || null;

    const [appointments, referrals, consultations, prescriptions, diagnostics, followups, triages, notifications] = await Promise.all([
      Appointment.find({ patient_id: pId }).sort({ date: -1, time: -1 }).lean(),
      Referral.find({ patient_id: pId }).sort({ created_at: -1 }).lean(),
      Consultation.find({ patient_id: pId }).sort({ created_at: -1 }).lean(),
      Prescription.find({ patient_id: pId }).sort({ created_at: -1 }).lean(),
      DiagnosticOrder.find({ patient_id: pId }).sort({ created_at: -1 }).lean(),
      Followup.find({ patient_id: pId }).sort({ created_at: -1 }).lean(),
      Triage.find({ patient_id: pId }).sort({ created_at: -1 }).lean(),
      Notification.find({
        $or: [
          { recipient_id: pId },
          { recipient_user_id: req.user.user_id }
        ]
      }).sort({ created_at: -1 }).limit(20).lean()
    ]);

    const encounters = [
      ...sanitizeArray(triages).map(t => ({
        id: t.triage_id,
        date: t.created_at ? t.created_at.split('T')[0] : 'N/A',
        created_at: t.created_at,
        facility: t.facility_name || t.facility_id || 'PHC Mulshi',
        doctor: t.health_worker_id || 'Health Worker',
        type: 'Digital Triage',
        reason: t.symptoms || t.reason || 'Vitals & Triage Assessment',
        outcome: `Priority: ${t.priority || 'ROUTINE'}`,
        status: 'COMPLETED'
      })),
      ...sanitizeArray(consultations).map(c => ({
        id: c.consultation_id,
        date: c.created_at ? c.created_at.split('T')[0] : 'N/A',
        created_at: c.created_at,
        facility: c.facility_name || 'Primary Health Centre',
        doctor: c.doctor_name || c.doctor_id || 'Attending Doctor',
        type: 'Doctor Consultation',
        reason: c.complaint || c.notes || 'Clinical Consultation',
        outcome: c.diagnosis || 'Consultation Completed',
        status: 'COMPLETED'
      })),
      ...sanitizeArray(diagnostics).filter(d => d.status === 'COMPLETED').map(d => ({
        id: d.order_id,
        date: d.created_at ? d.created_at.split('T')[0] : 'N/A',
        created_at: d.created_at,
        facility: d.facility_id || 'Diagnostic Lab',
        doctor: d.doctor_id || 'Pathologist',
        type: 'Diagnostic Report',
        reason: d.test_name || 'Lab Test',
        outcome: d.results || 'Report Generated',
        status: 'COMPLETED'
      }))
    ].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    res.json({
      patient: {
        ...sanitizeDoc(patient),
        blood_group: bloodGroup,
        medical_info: {
          blood_group: bloodGroup,
          allergies: patient.medical_info?.allergies || patient.allergies || [],
          existing_conditions: patient.medical_info?.existing_conditions || patient.conditions || []
        }
      },
      appointments: sanitizeArray(appointments),
      referrals: sanitizeArray(referrals),
      consultations: sanitizeArray(consultations),
      prescriptions: sanitizeArray(prescriptions),
      diagnostics: sanitizeArray(diagnostics),
      followups: sanitizeArray(followups),
      encounters,
      notifications: sanitizeArray(notifications),
      maternal: patient.is_maternal ? {
        is_maternal: true,
        gestational_age_weeks: patient.gestational_age_weeks || 24,
        edd_date: patient.edd_date || '2026-12-17',
        risk_category: patient.risk_category || 'NORMAL',
        assigned_asha: patient.assigned_asha || 'Sunita Shinde',
        vitals: patient.vitals || {}
      } : null
    });
  } catch (err) {
    console.error('Error fetching patient dashboard:', err);
    res.status(500).json({ error: 'Failed to fetch patient dashboard data' });
  }
});


app.post('/api/triage', authenticate, allow('health_worker'), async (req, res) => {
  const { patient_id, indicators = [], vitals = {}, reason } = req.body || {};
  const priority = req.body?.priority || req.body?.triage_priority || 'ROUTINE';
  const patient = await findPatient(patient_id);

  if (!patient || !(await canAccessPatient(req.user, patient))) {
    return res.status(403).json({ error: 'Patient is outside your facility scope' });
  }

  const record = await Triage.create({
    triage_id: `TRG-${Date.now().toString().slice(-6)}`,
    patient_id,
    priority,
    indicators,
    vitals,
    temperature: vitals.temp || vitals.temperature,
    oxygen_saturation: vitals.spo2 || vitals.oxygen_saturation,
    heart_rate: vitals.pulse || vitals.heart_rate,
    symptoms: Array.isArray(indicators) ? indicators.join(', ') : (indicators || ''),
    reason,
    doctor_id: req.body.doctor_id,
    facility_id: req.user.facility_id,
    health_worker_id: req.user.user_id,
    created_at: new Date().toISOString(),
    sync_status: 'SYNCED'
  });

  const assignedDocId = req.body.doctor_id || req.body.assigned_doctor_id;
  if (assignedDocId) {
    await createTargetedNotification({
      recipient_id: assignedDocId,
      recipient_user_id: assignedDocId,
      recipient_role: 'doctor',
      title: priority === 'EMERGENCY' ? 'CRITICAL TRIAGE EMERGENCY DETECTED' : 'Triage Assigned',
      message: `Triage (${priority}) assigned for Patient ${patient_id} (${reason || 'Care required'}).`,
      type: priority === 'EMERGENCY' ? 'EMERGENCY' : 'TRIAGE',
      link: `/triage/${record.triage_id}`
    });
  } else if (priority === 'EMERGENCY' || priority === 'CRITICAL') {
    await createTargetedNotification({
      recipient_id: 'ALL_EMERGENCY',
      recipient_role: 'doctor',
      title: 'CRITICAL TRIAGE EMERGENCY DETECTED',
      message: `Emergency triage priority for Patient ${patient_id} (${reason || 'Immediate care required'})`,
      type: 'EMERGENCY',
      link: `/triage/${record.triage_id}`
    });
  }

  if (priority === 'EMERGENCY' || priority === 'CRITICAL') {
    await EmergencyEscalation.create({
      escalation_id: `EMG-${Date.now().toString().slice(-6)}`,
      triage_id: record.triage_id,
      patient_id,
      patient_name: patient.name,
      source_facility_id: req.user.facility_id || 'FAC-101',
      target_facility_id: req.user.facility_id || 'FAC-101',
      target_doctor_id: req.body.doctor_id,
      reason: reason || 'Emergency Triage Triggered',
      priority,
      status: 'EMERGENCY',
      created_at: new Date().toISOString()
    }).catch(e => console.warn('Emergency escalation create error:', e));
  }

  await Patient.findOneAndUpdate({ patient_id }, { $set: { triage_status: priority, triage_reason: reason } });
  await audit(req.user, 'TRIAGE', 'AUTHORIZED', patient_id, priority);
  res.status(201).json({ triage: sanitizeDoc(record) });
});


app.get('/api/triages', authenticate, async (req, res) => {
  const filter = req.user.role === 'patient'
    ? { patient_id: req.user.patient_id }
    : req.user.role === 'health_worker' || req.user.role === 'facility_admin'
    ? { facility_id: req.user.facility_id }
    : {};
  const triages = await Triage.find(filter).sort({ created_at: -1 }).lean();
  res.json({ triages: sanitizeArray(triages) });
});

const scoreFacility = async (
  facility,
  {
    specialty = '',
    diagnostic = '',
    emergency = false,
    equipment = '',
    bedRequired = false,
    medicine = ''
  } = {}
) => {
  const reasons = [];

  // -----------------------------
  // 1. SPECIALTY
  // -----------------------------
  const specialties = Array.isArray(facility.specialties)
    ? facility.specialties
    : [];

  const hasSpecialty =
    !specialty ||
    specialties.some((item) =>
      String(item)
        .toLowerCase()
        .includes(String(specialty).toLowerCase())
    );

  // -----------------------------
  // 2. REAL DIAGNOSTIC DATA
  // -----------------------------
  const diagnosticQuery = {
    facility_id: facility.facility_id
  };

  if (diagnostic) {
    diagnosticQuery.name = new RegExp(
      String(diagnostic).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );
  }

  const diagnosticRecord = await Diagnostic.findOne(
    diagnosticQuery
  ).lean();

  const hasDiagnostic =
    !diagnostic || Boolean(diagnosticRecord);

  // -----------------------------
  // 3. REAL EQUIPMENT DATA
  // -----------------------------
  const equipmentQuery = {
    facility_id: facility.facility_id
  };

  if (equipment) {
    equipmentQuery.name = new RegExp(
      String(equipment).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i'
    );
  }

  const equipmentRecord = await Equipment.findOne(
    equipmentQuery
  ).lean();

  const equipmentReady =
    !equipment ||
    Boolean(
      equipmentRecord &&
      Number(equipmentRecord.available_quantity || 0) > 0 &&
      equipmentRecord.status !== 'MAINTENANCE'
    );

  // -----------------------------
  // 4. REAL BED DATA
  // -----------------------------
  const bedRecord = await Bed.findOne({
    facility_id: facility.facility_id
  }).lean();

  const bedsReady =
    !bedRequired ||
    Boolean(
      bedRecord &&
      Number(bedRecord.available_beds || 0) > 0
    );

  // -----------------------------
  // 5. EMERGENCY CAPABILITY
  // -----------------------------
  const emergencyReady =
    !emergency ||
    specialties.some((item) =>
      /emergency|icu|trauma/i.test(String(item))
    ) ||
    facility.type === 'District Hospital' ||
    facility.type === 'General Hospital';

  // -----------------------------
  // 6. REAL MEDICINE DATA
  // -----------------------------
  let medicineReady = true;

  if (medicine) {
    const medicineRecord = await Medicine.findOne({
      facility_id: facility.facility_id,
      name: new RegExp(
        String(medicine).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i'
      ),
      current_stock: { $gt: 0 }
    }).lean();

    medicineReady = Boolean(medicineRecord);
  }

  // -----------------------------
  // 7. MATCH SCORE
  // -----------------------------
  const score = Math.round(
    (hasSpecialty ? 25 : 0) +
    (hasDiagnostic ? 20 : 0) +
    (emergencyReady ? 20 : 0) +
    (equipmentReady ? 15 : 0) +
    (bedsReady ? 10 : 0) +
    (medicineReady ? 5 : 0) +
    (facility.status === 'AVAILABLE' ? 5 : 0)
  );

  // -----------------------------
  // 8. HUMAN-READABLE REASONS
  // -----------------------------
  if (hasSpecialty) {
    reasons.push('Specialty available');
  }

  if (hasDiagnostic) {
    reasons.push(
      diagnostic
        ? `Diagnostic available: ${diagnosticRecord.name}`
        : 'Diagnostic services available'
    );
  }

  if (emergencyReady) {
    reasons.push('Emergency capability available');
  }

  if (equipmentReady) {
    reasons.push(
      equipment
        ? `Equipment available: ${equipmentRecord.name}`
        : 'Required equipment available'
    );
  }

  if (bedsReady) {
    reasons.push(
      bedRecord
        ? `${bedRecord.available_beds} beds currently available`
        : 'Bed availability confirmed'
    );
  }

  if (medicineReady && medicine) {
    reasons.push(`Medicine available: ${medicine}`);
  }

  if (facility.status === 'AVAILABLE') {
    reasons.push('Facility operational');
  }

  return {
    facility_id: facility.facility_id,
    facility: facility.name,
    type: facility.type,
    district: facility.district,
    distance: facility.distance_km,

    match_score: score,

    reasons,

    specialty_available: hasSpecialty,
    diagnostic_available: hasDiagnostic,
    emergency_ready: emergencyReady,
    equipment_available: equipmentReady,
    beds_available: bedsReady,
    medicine_available: medicineReady,

    available_beds: bedRecord
      ? bedRecord.available_beds
      : 0,

    available_icu_beds: bedRecord
      ? bedRecord.available_icu_beds
      : 0
  };
};


app.post(
  '/api/facilities/match',
  authenticate,
  async (req, res) => {
    try {
      const facilities = await Facility.find().lean();

      const matches = await Promise.all(
        facilities.map((facility) =>
          scoreFacility(facility, req.body || {})
        )
      );

      matches.sort(
        (a, b) => b.match_score - a.match_score
      );

      await audit(
        req.user,
        'FACILITY_MATCH_REQUESTED',
        'AUTHORIZED'
      );

      res.json({
        weights: {
          specialty: 25,
          diagnostic: 20,
          emergency: 20,
          equipment: 15,
          beds: 10,
          medicines: 5,
          facility_status: 5
        },
        matches
      });
    } catch (error) {
      console.error(
        'Facility matching error:',
        error
      );

      res.status(500).json({
        error: 'Unable to calculate facility matches'
      });
    }
  }
);

app.get('/api/facilities', authenticate, async (req, res) => {
  let query = {};
  if (req.user && req.user.role === 'district_authority') {
    const rawDistrict = req.user.district || req.user.jurisdiction || 'Pune';
    const canonicalDistrict = rawDistrict.replace(/\s+District$/i, '').trim();
    query.district = new RegExp(`^${canonicalDistrict}$`, 'i');
  } else if (req.query.district) {
    const canonicalDistrict = String(req.query.district).replace(/\s+District$/i, '').trim();
    query.district = new RegExp(`^${canonicalDistrict}$`, 'i');
  }

  const facilities = await Facility.find(query).lean();
  res.json({ facilities: sanitizeArray(facilities) });
});

const districtScopeFor = (user) => String(user.district || user.jurisdiction || '').replace(/\s+District$/i, '').trim();

app.get('/api/district/dashboard', authenticate, allow('district_authority'), async (req, res) => {
  try {
    const district = districtScopeFor(req.user);
    if (!district) return res.status(400).json({ error: 'District is not configured for this account' });

    const facilities = await Facility.find({ district: new RegExp(`^${district}$`, 'i') }).lean();
    const facilityIds = facilities.map((facility) => facility.facility_id);
    const selectedFacilityId = req.query.facility_id || facilities[0]?.facility_id;
    if (selectedFacilityId && !facilityIds.includes(selectedFacilityId)) return res.status(403).json({ error: 'Facility is outside your district' });

    const districtReferralFilter = { $or: [
      { referring_facility_id: { $in: facilityIds } },
      { target_facility_id: { $in: facilityIds } },
      { destination_facility_id: { $in: facilityIds } },
      { accepted_facility_id: { $in: facilityIds } },
      { 'target_hospitals.facility_id': { $in: facilityIds } }
    ] };
    const [doctors, beds, medicines, diagnostics, referrals, attendance, selectedEquipment] = await Promise.all([
      User.find({ role: 'doctor', facility_id: { $in: facilityIds } }).lean(),
      Bed.find({ facility_id: { $in: facilityIds } }).lean(),
      Medicine.find({ facility_id: { $in: facilityIds } }).lean(),
      Diagnostic.find({ facility_id: { $in: facilityIds } }).lean(),
      Referral.find(districtReferralFilter).sort({ created_at: -1 }).lean(),
      Attendance.find({ facility_id: { $in: facilityIds } }).sort({ date: -1, created_at: -1 }).lean(),
      selectedFacilityId ? Equipment.find({ facility_id: selectedFacilityId }).lean() : []
    ]);
    const facilityBedMap = new Map(beds.map((bed) => [bed.facility_id, bed]));
    const statusOf = (value) => String(value || '').toUpperCase();
    const selectedFacility = facilities.find((facility) => facility.facility_id === selectedFacilityId) || null;
    const facilityData = selectedFacility ? {
      facility: sanitizeDoc({ ...selectedFacility, ...(facilityBedMap.get(selectedFacilityId) || {}) }),
      doctors: doctors.filter((doctor) => doctor.facility_id === selectedFacilityId).map(publicUser),
      medicines: sanitizeArray(medicines.filter((medicine) => medicine.facility_id === selectedFacilityId)),
      diagnostics: sanitizeArray(diagnostics.filter((diagnostic) => diagnostic.facility_id === selectedFacilityId)),
      equipment: sanitizeArray(selectedEquipment),
      referrals: sanitizeArray(referrals.filter((referral) => [referral.referring_facility_id, referral.target_facility_id, referral.destination_facility_id, referral.accepted_facility_id].includes(selectedFacilityId))),
      attendance: sanitizeArray(attendance.filter((record) => record.facility_id === selectedFacilityId))
    } : null;

    res.json({
      district: { value: district, display_name: `${district} District` },
      facilities: sanitizeArray(facilities.map((facility) => ({ ...facility, ...(facilityBedMap.get(facility.facility_id) || {}) }))),
      summary: {
        facility_count: facilities.length,
        doctor_count: doctors.length,
        available_beds: beds.reduce((sum, bed) => sum + Number(bed.available_beds || 0), 0),
        available_icu_beds: beds.reduce((sum, bed) => sum + Number(bed.available_icu_beds || 0), 0),
        pending_referrals: referrals.filter((referral) => ['PENDING', 'SENT'].includes(statusOf(referral.status))).length,
        medicine_alerts: medicines.filter((medicine) => ['LOW', 'LOW_STOCK', 'CRITICAL', 'OUT_OF_STOCK'].includes(statusOf(medicine.status))).length,
        diagnostic_capacity: diagnostics.reduce((sum, diagnostic) => sum + Number(diagnostic.remaining_capacity || 0), 0),
        attendance_records: attendance.length
      },
      selected_facility: facilityData
    });
  } catch (error) {
    console.error('District dashboard load failed:', error);
    res.status(500).json({ error: 'Unable to load district dashboard' });
  }
});

app.get('/api/referrals/analytics', authenticate, allow('district_authority'), async (req, res) => {
  try {
    const district = districtScopeFor(req.user);
    if (!district) return res.status(400).json({ error: 'District is not configured for this account' });
    const facilities = await Facility.find({ district: new RegExp(`^${district}$`, 'i') }).lean();
    const facilityIds = facilities.map((facility) => facility.facility_id);
    const names = new Map(facilities.map((facility) => [facility.facility_id, facility.name]));
    const referrals = await Referral.find({ $or: [
      { referring_facility_id: { $in: facilityIds } }, { target_facility_id: { $in: facilityIds } },
      { destination_facility_id: { $in: facilityIds } }, { accepted_facility_id: { $in: facilityIds } },
      { 'target_hospitals.facility_id': { $in: facilityIds } }
    ] }).sort({ created_at: -1 }).lean();
    const statusOf = (value) => String(value || '').toUpperCase();
    const statusCounts = referrals.reduce((counts, referral) => {
      const status = statusOf(referral.status) || 'UNSPECIFIED';
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});
    const countNodes = (idFor) => Object.entries(referrals.reduce((counts, referral) => {
      const id = idFor(referral);
      if (id) counts[id] = (counts[id] || 0) + 1;
      return counts;
    }, {})).sort(([, left], [, right]) => right - left).slice(0, 3).map(([facility_id, count]) => ({ facility_id, name: names.get(facility_id) || facility_id, count }));
    const resolutionMinutes = referrals.map((referral) => {
      const end = referral.accepted_at || referral.rejected_at;
      const start = referral.created_at;
      const duration = end && start ? (new Date(end) - new Date(start)) / 60000 : null;
      return Number.isFinite(duration) && duration >= 0 ? duration : null;
    }).filter((duration) => duration !== null);
    res.json({
      district: { value: district, display_name: `${district} District` },
      referrals: sanitizeArray(referrals),
      status_counts: statusCounts,
      metrics: {
        total: referrals.length,
        pending_action: referrals.filter((referral) => ['PENDING', 'SENT'].includes(statusOf(referral.status))).length,
        accepted_routing: referrals.filter((referral) => statusOf(referral.status) === 'ACCEPTED').length,
        rejected_rerouted: referrals.filter((referral) => statusOf(referral.status) === 'REJECTED').length,
        completed_transfers: referrals.filter((referral) => statusOf(referral.status) === 'COMPLETED').length,
        acceptance_rate: referrals.length ? (referrals.filter((referral) => statusOf(referral.status) === 'ACCEPTED').length / referrals.length) * 100 : null,
        average_resolution_minutes: resolutionMinutes.length ? resolutionMinutes.reduce((sum, duration) => sum + duration, 0) / resolutionMinutes.length : null
      },
      top_referring_facilities: countNodes((referral) => referral.referring_facility_id),
      top_receiving_facilities: countNodes((referral) => referral.target_facility_id || referral.destination_facility_id || referral.accepted_facility_id)
    });
  } catch (error) {
    console.error('Referral analytics load failed:', error);
    res.status(500).json({ error: 'Unable to load referral analytics' });
  }
});

app.patch('/api/facilities/:facilityId/resources', authenticate, allow('facility_admin'), async (req, res) => {
  const facility = await Facility.findOne({ facility_id: req.params.facilityId }).lean();
  if (!facility || facility.facility_id !== req.user.facility_id) {
    return res.status(403).json({ error: 'Facility resource access denied' });
  }

  const activeBeds = req.body.active_beds !== undefined ? Number(req.body.active_beds) : (facility.active_beds || 0);
  const occupiedBeds = req.body.occupied_beds !== undefined ? Number(req.body.occupied_beds) : (facility.occupied_beds !== undefined ? facility.occupied_beds : Math.max(0, activeBeds - (facility.available_beds || 0)));
  const availableBeds = req.body.available_beds !== undefined ? Number(req.body.available_beds) : Math.max(0, activeBeds - occupiedBeds);
  const icuBeds = req.body.icu_beds !== undefined ? Number(req.body.icu_beds) : (facility.icu_beds || 0);
  const availableIcuBeds = req.body.available_icu_beds !== undefined ? Number(req.body.available_icu_beds) : (facility.available_icu_beds || 0);

  const updatedFacility = await Facility.findOneAndUpdate(
    { facility_id: req.params.facilityId },
    {
      $set: {
        ...req.body,
        active_beds: activeBeds,
        available_beds: availableBeds,
        occupied_beds: occupiedBeds,
        icu_beds: icuBeds,
        available_icu_beds: availableIcuBeds,
        last_verified: 'Just now'
      }
    },
    { returnDocument: 'after' }
  ).lean();

  await Bed.findOneAndUpdate(
    { facility_id: req.params.facilityId },
    {
      $set: {
        total_beds: activeBeds,
        available_beds: availableBeds,
        occupied_beds: occupiedBeds,
        icu_beds: icuBeds,
        available_icu_beds: availableIcuBeds,
        updated_at: new Date()
      }
    },
    { upsert: true, returnDocument: 'after' }
  );

  await audit(req.user, 'FACILITY_RESOURCES_UPDATED', 'AUTHORIZED', null, `Beds updated: ${availableBeds}/${activeBeds}`);
  res.json({ facility: sanitizeDoc(updatedFacility) });
});

app.get('/api/appointments', authenticate, async (req, res) => {
  const filter = req.user.role === 'patient'
    ? { patient_id: req.user.patient_id }
    : req.user.role === 'doctor'
    ? { doctor_id: req.user.user_id }
    : req.user.role === 'health_worker' && req.user.facility_id
    ? { facility_id: req.user.facility_id }
    : {};
  const appointments = await Appointment.find(filter).sort({ created_at: -1 }).lean();
  res.json({ appointments: sanitizeArray(appointments) });
});

app.post('/api/appointments', authenticate, allow('patient', 'health_worker', 'doctor'), async (req, res) => {
  try {
    const { patient_id, doctor_id, facility_id, date, time, notes } = req.body || {};

    const targetPatientId = patient_id || req.user.patient_id || req.user.user_id;
    if (!targetPatientId) {
      return res.status(400).json({ error: 'Patient ID is required' });
    }

    let patientObj = await Patient.findOne({ patient_id: targetPatientId }).lean();
    if (!patientObj) {
      patientObj = await User.findOne({ patient_id: targetPatientId }).lean();
    }
    const patientName = patientObj?.name || req.body.patient_name || req.user.name || 'Patient';

    let selectedFacilityId = facility_id || req.user.registered_facility_id || req.user.facility_id || patientObj?.registered_facility_id || 'FAC-101';
    let facilityObj = await Facility.findOne({ facility_id: selectedFacilityId }).lean();
    if (!facilityObj) {
      facilityObj = await Facility.findOne({ facility_id: 'FAC-101' }).lean();
      selectedFacilityId = facilityObj?.facility_id || 'FAC-101';
    }
    const facilityName = facilityObj?.name || req.body.facility_name || 'Primary Health Centre';

    let doctorObj = null;
    if (doctor_id) {
      doctorObj = await User.findOne({ user_id: doctor_id, role: 'doctor' }).lean();
      if (!doctorObj) {
        doctorObj = await User.findOne({ role: 'doctor', $or: [{ user_id: doctor_id }, { name: doctor_id }] }).lean();
      }
    }

    if (doctorObj && doctorObj.facility_id && doctorObj.facility_id !== selectedFacilityId) {
      return res.status(400).json({
        error: `Selected doctor (${doctorObj.name}) belongs to ${doctorObj.facility_name || doctorObj.facility_id}, not ${facilityName} (${selectedFacilityId}). Please select a doctor from ${facilityName}.`
      });
    }

    if (!doctorObj) {
      doctorObj = await User.findOne({ role: 'doctor', facility_id: selectedFacilityId }).lean();
    }

    const doctorName = doctorObj?.name || req.body.doctor_name || 'Specialist Doctor';

    const appointment = await Appointment.create({
      appointment_id: `APT-${Date.now().toString().slice(-6)}`,
      patient_id: targetPatientId,
      patient_name: patientName,
      doctor_id: doctorObj?.user_id || doctor_id || 'USR-DOC-001',
      doctor_name: doctorName,
      facility_id: selectedFacilityId,
      facility_name: facilityName,
      date: date || new Date().toISOString().split('T')[0],
      time: time || '10:00 AM',
      notes: notes || '',
      status: 'BOOKED',
      created_by: req.user.user_id,
      created_at: new Date().toISOString()
    });

    await audit(req.user, 'APPOINTMENT_CREATED', 'AUTHORIZED', appointment.patient_id, `Booked at ${facilityName} with ${doctorName}`);
    res.status(201).json({ appointment: sanitizeDoc(appointment) });
  } catch (err) {
    console.error('Appointment booking error:', err);
    res.status(500).json({ error: 'Unable to book appointment' });
  }
});

app.get('/api/queue', authenticate, allow('doctor'), async (req, res) => {
  const queue = await Appointment.find({ doctor_id: req.user.user_id, status: { $ne: 'CANCELLED' } }).lean();
  res.json({ queue: sanitizeArray(queue) });
});

app.patch('/api/queue/:appointmentId', authenticate, allow('doctor'), async (req, res) => {
  const appointment = await Appointment.findOneAndUpdate(
    { appointment_id: req.params.appointmentId },
    { $set: { status: req.body.status } },
    { returnDocument: 'after' }
  ).lean();

  if (!appointment) return res.status(404).json({ error: 'Queue entry not found' });
  res.json({ appointment: sanitizeDoc(appointment) });
});

app.post('/api/consultations', authenticate, allow('doctor'), async (req, res) => {
  const patient = await findPatient(req.body.patient_id);
  if (!(await canAccessPatient(req.user, patient, true))) {
    return res.status(403).json({ error: 'Clinical access window is not active' });
  }

  const consultation = await Consultation.create({
    ...req.body,
    consultation_id: `CON-${Date.now().toString().slice(-6)}`,
    doctor_id: req.user.user_id,
    facility_id: req.user.facility_id,
    created_at: new Date().toISOString()
  });

  await audit(req.user, 'CONSULTATION_CREATED', 'AUTHORIZED', consultation.patient_id);
  res.status(201).json({ consultation: sanitizeDoc(consultation) });
});

app.get('/api/consultations', authenticate, async (req, res) => {
  let filter = {};
  if (req.user.role === 'patient') {
    filter = { patient_id: req.user.patient_id };
  } else if (req.user.role === 'doctor') {
    filter = { doctor_id: req.user.user_id };
  } else if (req.user.role === 'health_worker' && req.query.patient_id) {
    filter = { patient_id: req.query.patient_id };
  } else if (req.user.role === 'facility_admin') {
    filter = { facility_id: req.user.facility_id };
  }
  const consultations = await Consultation.find(filter).sort({ created_at: -1 }).lean();
  res.json({ consultations: sanitizeArray(consultations) });
});

app.post('/api/prescriptions', authenticate, allow('doctor'), async (req, res) => {
  const prescription = await Prescription.create({
    ...req.body,
    prescription_id: `RX-${Date.now().toString().slice(-6)}`,
    doctor_id: req.user.user_id,
    created_at: new Date().toISOString()
  });

  await createTargetedNotification({
    recipient_id: prescription.patient_id,
    recipient_role: 'patient',
    title: 'New Prescription Issued',
    message: `Dr. ${req.user.name} issued a new prescription.`,
    type: 'PRESCRIPTION',
    link: '/patient/prescriptions'
  });

  await audit(req.user, 'PRESCRIPTION_CREATED', 'AUTHORIZED', prescription.patient_id);
  res.status(201).json({ prescription: sanitizeDoc(prescription) });
});

app.get('/api/prescriptions', authenticate, async (req, res) => {
  const filter = req.user.role === 'patient'
    ? { patient_id: req.user.patient_id }
    : req.user.role === 'doctor'
    ? { doctor_id: req.user.user_id }
    : {};
  const prescriptions = await Prescription.find(filter).lean();
  res.json({ prescriptions: sanitizeArray(prescriptions) });
});

app.post('/api/diagnostics/orders', authenticate, allow('doctor'), async (req, res) => {
  const order = await DiagnosticOrder.create({
    ...req.body,
    order_id: `DOR-${Date.now().toString().slice(-6)}`,
    status: 'ORDERED',
    doctor_id: req.user.user_id,
    created_at: new Date().toISOString()
  });

  await createTargetedNotification({
    recipient_id: order.facility_id || 'FAC-101',
    recipient_role: 'health_worker',
    title: 'New Diagnostic Order Received',
    message: `Diagnostic test requested for Patient ${order.patient_id}`,
    type: 'DIAGNOSTIC',
    link: '/diagnostics'
  });

  await audit(req.user, 'DIAGNOSTIC_ORDER_CREATED', 'AUTHORIZED', order.patient_id);
  res.status(201).json({ order: sanitizeDoc(order) });
});

app.get('/api/diagnostics/orders', authenticate, async (req, res) => {
  const filter = req.user.role === 'patient'
    ? { patient_id: req.user.patient_id }
    : req.user.role === 'doctor'
    ? { doctor_id: req.user.user_id }
    : (req.user.role === 'health_worker' || req.user.role === 'facility_admin') && req.user.facility_id
    ? { facility_id: req.user.facility_id }
    : {};
  const orders = await DiagnosticOrder.find(filter).lean();
  res.json({ orders: sanitizeArray(orders) });
});

app.patch('/api/diagnostics/orders/:orderId', authenticate, allow('facility_admin', 'doctor', 'health_worker'), async (req, res) => {
  const updateData = {};
  if (req.body.status) updateData.status = req.body.status;
  if (req.body.result) updateData.result = req.body.result;
  if (req.body.accepted_by) updateData.accepted_by = req.body.accepted_by;

  const order = await DiagnosticOrder.findOneAndUpdate(
    { order_id: req.params.orderId },
    { $set: updateData },
    { returnDocument: 'after' }
  ).lean();

  if (!order) return res.status(404).json({ error: 'Diagnostic order not found' });

  if (req.body.status === 'COMPLETED') {
    await createTargetedNotification({
      recipient_id: order.doctor_id,
      recipient_role: 'doctor',
      title: 'Diagnostic Report Ready',
      message: `Diagnostic report for Patient ${order.patient_id} is completed.`,
      type: 'DIAGNOSTIC',
      link: `/diagnostics/${order.order_id}`
    });
  }

  await audit(req.user, 'DIAGNOSTIC_RESULT_UPDATED', 'AUTHORIZED', order.patient_id);
  res.json({ order: sanitizeDoc(order) });
});

app.post('/api/followups', authenticate, allow('doctor', 'health_worker'), async (req, res) => {
  const followup = await Followup.create({
    ...req.body,
    followup_id: `FUP-${Date.now().toString().slice(-6)}`,
    status: 'SCHEDULED',
    created_at: new Date().toISOString()
  });

  await createTargetedNotification({
    recipient_id: followup.patient_id,
    recipient_role: 'patient',
    title: 'Follow-up Scheduled',
    message: `Follow-up scheduled on ${followup.followup_date || 'upcoming date'} (${followup.reason || 'General checkup'}).`,
    type: 'FOLLOWUP',
    link: '/patient/followups'
  });

  await audit(req.user, 'FOLLOWUP_CREATED', 'AUTHORIZED', followup.patient_id);
  res.status(201).json({ followup: sanitizeDoc(followup) });
});

app.get('/api/followups', authenticate, async (req, res) => {
  const filter = req.user.role === 'patient'
    ? { patient_id: req.user.patient_id }
    : req.user.role === 'doctor'
    ? { doctor_id: req.user.user_id }
    : {};
  const followups = await Followup.find(filter).lean();
  res.json({ followups: sanitizeArray(followups) });
});

/* --- Teleconsultation Routes --- */
app.post('/api/teleconsultations', authenticate, allow('health_worker', 'patient'), async (req, res) => {
  const teleId = `TC-${Date.now().toString().slice(-6)}`;
  const roomId = `ROOM-${Date.now().toString().slice(-6)}`;
  const tele = await Teleconsultation.create({
    ...req.body,
    teleconsultation_id: teleId,
    requested_by: req.user.user_id,
    facility_id: req.user.facility_id || req.body.facility_id || 'FAC-101',
    status: 'REQUESTED',
    room_id: roomId,
    meeting_link: `https://meet.mahahealth.gov.in/${roomId}`,
    created_at: new Date().toISOString()
  });

  await createTargetedNotification({
    recipient_id: req.body.doctor_id,
    recipient_role: 'doctor',
    title: 'Teleconsultation Requested',
    message: `New teleconsultation request for Patient ${req.body.patient_id}`,
    type: 'TELECONSULTATION',
    link: `/teleconsultation/${teleId}`
  });

  await audit(req.user, 'TELECONSULTATION_REQUESTED', 'AUTHORIZED', req.body.patient_id);
  res.status(201).json({ teleconsultation: sanitizeDoc(tele) });
});

app.get('/api/teleconsultations', authenticate, async (req, res) => {
  let filter = {};
  if (req.user.role === 'patient') {
    filter = { patient_id: req.user.patient_id };
  } else if (req.user.role === 'doctor') {
    filter = { doctor_id: req.user.user_id };
  } else if (req.user.role === 'health_worker') {
    filter = { $or: [{ requested_by: req.user.user_id }, { facility_id: req.user.facility_id }] };
  }
  const items = await Teleconsultation.find(filter).sort({ created_at: -1 }).lean();
  res.json({ teleconsultations: sanitizeArray(items) });
});

app.patch('/api/teleconsultations/:teleId/status', authenticate, allow('doctor', 'health_worker'), async (req, res) => {
  const { status, notes } = req.body || {};
  const tele = await Teleconsultation.findOne({ teleconsultation_id: req.params.teleId });
  if (!tele) return res.status(404).json({ error: 'Teleconsultation not found' });

  if (status) tele.status = status;
  if (notes) tele.notes = notes;
  tele.updated_at = new Date().toISOString();
  await tele.save();

  await createTargetedNotification({
    recipient_id: tele.requested_by,
    recipient_role: 'health_worker',
    title: `Teleconsultation ${status}`,
    message: `Teleconsultation ${tele.teleconsultation_id} is now ${status}`,
    type: 'TELECONSULTATION',
    link: `/teleconsultation/${tele.teleconsultation_id}`
  });

  await audit(req.user, `TELECONSULTATION_${status}`, 'AUTHORIZED', tele.patient_id);
  res.json({ teleconsultation: sanitizeDoc(tele) });
});

/* --- Attendance Routes --- */
app.post('/api/attendance/check-in', authenticate, allow('doctor', 'health_worker', 'facility_admin'), async (req, res) => {
  const targetUserId = req.user.user_id;
  const targetUserName = req.user.name;
  const targetRole = req.user.role;
  const facilityId = req.user.facility_id || 'FAC-101';
  const today = new Date().toISOString().split('T')[0];

  const existing = await Attendance.findOne({ user_id: targetUserId, date: today }).lean();
  if (existing) {
    return res.status(400).json({ error: 'Already checked in for today', attendance: sanitizeDoc(existing) });
  }

  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const att = await Attendance.create({
    attendance_id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    user_id: targetUserId,
    user_name: targetUserName,
    role: targetRole,
    facility_id: facilityId,
    date: today,
    check_in: nowTime,
    check_out: '—',
    status: 'PRESENT',
    created_at: new Date().toISOString()
  });

  await audit(req.user, 'ATTENDANCE_CHECKIN', 'AUTHORIZED', targetUserId, `Check-in at ${nowTime}`);
  res.status(201).json({ attendance: sanitizeDoc(att) });
});

app.post('/api/attendance/check-out', authenticate, allow('doctor', 'health_worker', 'facility_admin'), async (req, res) => {
  const targetUserId = req.user.user_id;
  const today = new Date().toISOString().split('T')[0];
  const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const att = await Attendance.findOneAndUpdate(
    { user_id: targetUserId, date: today },
    { $set: { check_out: nowTime, status: 'COMPLETED' } },
    { returnDocument: 'after' }
  ).lean();

  if (!att) return res.status(404).json({ error: 'No active check-in record found for today' });

  await audit(req.user, 'ATTENDANCE_CHECKOUT', 'AUTHORIZED', targetUserId, `Check-out at ${nowTime}`);
  res.json({ attendance: sanitizeDoc(att) });
});

app.get('/api/attendance', authenticate, async (req, res) => {
  let filter = {};
  if (req.query.facility_id) {
    filter.facility_id = req.query.facility_id;
  } else if (req.user.role === 'facility_admin') {
    filter.facility_id = req.user.facility_id;
  } else if (req.user.role === 'district_authority') {
    filter = {};
  } else {
    if (req.query.user_id) {
      filter.user_id = req.query.user_id;
    } else if (req.user.facility_id) {
      filter.facility_id = req.user.facility_id;
    } else {
      filter.user_id = req.user.user_id;
    }
  }
  const records = await Attendance.find(filter).sort({ date: -1, created_at: -1 }).lean();
  res.json({ attendance: sanitizeArray(records) });
});

/* --- Notification Routes --- */
app.get('/api/notifications', authenticate, async (req, res) => {
  const userOrPatientId = req.user.patient_id || req.user.user_id;
  const filter = {
    $or: [
      { recipient_id: req.user.user_id },
      { recipient_user_id: req.user.user_id },
      { recipient_id: userOrPatientId },
      { recipient_user_id: userOrPatientId }
    ]
  };
  const notifications = await Notification.find(filter).sort({ created_at: -1 }).limit(50).lean();
  res.json({ notifications: sanitizeArray(notifications) });
});

app.patch('/api/notifications/:id/read', authenticate, async (req, res) => {
  const notif = await Notification.findOne({ notification_id: req.params.id });
  if (!notif) return res.status(404).json({ error: 'Notification not found' });

  const userOrPatientId = req.user.patient_id || req.user.user_id;
  const isRecipient = (
    notif.recipient_id === req.user.user_id ||
    notif.recipient_user_id === req.user.user_id ||
    notif.recipient_id === userOrPatientId ||
    notif.recipient_user_id === userOrPatientId ||
    notif.recipient_role === req.user.role
  );

  if (!isRecipient) {
    return res.status(403).json({ error: 'Access denied to this notification' });
  }

  notif.read = true;
  await notif.save();
  res.json({ notification: sanitizeDoc(notif) });
});

/* --- Emergency Escalation Routes --- */
app.post('/api/emergency/escalate', authenticate, allow('health_worker', 'doctor'), async (req, res) => {
  const escalationId = `EMG-${Date.now().toString().slice(-6)}`;
  const escalation = await EmergencyEscalation.create({
    ...req.body,
    escalation_id: escalationId,
    source_facility_id: req.user.facility_id || 'FAC-101',
    status: 'ESCALATED',
    created_at: new Date().toISOString()
  });

  await createTargetedNotification({
    recipient_id: req.body.target_doctor_id || 'ALL_EMERGENCY',
    recipient_role: 'doctor',
    title: 'EMERGENCY ESCALATION RECEIVED',
    message: `Emergency escalation for Patient ${req.body.patient_id}: ${req.body.reason}`,
    type: 'EMERGENCY',
    link: `/emergency/${escalationId}`
  });

  await audit(req.user, 'EMERGENCY_ESCALATION_CREATED', 'AUTHORIZED', req.body.patient_id);
  res.status(201).json({ escalation: sanitizeDoc(escalation) });
});

app.get('/api/emergency/escalations', authenticate, async (req, res) => {
  let filter = {};
  if (req.user.role === 'facility_admin' || req.user.role === 'health_worker') {
    filter = { $or: [{ source_facility_id: req.user.facility_id }, { target_facility_id: req.user.facility_id }] };
  } else if (req.user.role === 'doctor') {
    filter = { $or: [{ target_doctor_id: req.user.user_id }, { target_facility_id: req.user.facility_id }] };
  }
  const items = await EmergencyEscalation.find(filter).sort({ created_at: -1 }).lean();
  res.json({ escalations: sanitizeArray(items) });
});

app.patch('/api/emergency/escalations/:id/status', authenticate, allow('doctor', 'facility_admin'), async (req, res) => {
  const { status } = req.body || {};
  const esc = await EmergencyEscalation.findOne({ escalation_id: req.params.id });
  if (!esc) return res.status(404).json({ error: 'Escalation record not found' });
  if (status) esc.status = status;
  esc.updated_at = new Date().toISOString();
  await esc.save();

  await audit(req.user, `EMERGENCY_ESCALATION_${status}`, 'AUTHORIZED', esc.patient_id);
  res.json({ escalation: sanitizeDoc(esc) });
});




app.get('/api/referrals', authenticate, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'patient') {
      const pId = req.user.patient_id || req.user.user_id;
      filter = { $or: [{ patient_id: pId }, { patient_id: req.user.user_id }] };
    } else if (req.user.role === 'health_worker') {
      filter = {
        $or: [
          { referring_facility_id: req.user.facility_id },
          { referring_worker: req.user.name }
        ]
      };
    } else if (req.user.role === 'doctor') {
      filter = {
        $or: [
          { referring_facility_id: req.user.facility_id },
          { 'target_hospitals.facility_id': req.user.facility_id },
          { accepted_facility_id: req.user.facility_id }
        ]
      };
    } else if (req.user.role === 'facility_admin') {
      filter = {
        $or: [
          { target_facility_id: req.user.facility_id },
          { destination_facility_id: req.user.facility_id },
          { referring_facility_id: req.user.facility_id },
          { accepted_facility_id: req.user.facility_id }
        ]
      };
    } else if (req.user.role === 'district_authority') {
      const rawDistrict = req.user.district || req.user.jurisdiction || 'Pune';
      const canonicalDistrict = rawDistrict.replace(/\s+District$/i, '').trim();
      const districtFacs = await Facility.find({ district: new RegExp(`^${canonicalDistrict}$`, 'i') }).select('facility_id').lean();
      const districtFacIds = districtFacs.map(f => f.facility_id);
      filter = {
        $or: [
          { referring_facility_id: { $in: districtFacIds } },
          { target_facility_id: { $in: districtFacIds } },
          { destination_facility_id: { $in: districtFacIds } },
          { accepted_facility_id: { $in: districtFacIds } },
          { 'target_hospitals.facility_id': { $in: districtFacIds } }
        ]
      };
    }

    const referrals = await Referral.find(filter)
      .sort({ created_at: -1 })
      .lean();

    const enrichedReferrals = await Promise.all(
      referrals.map(async (referral) => {
        const targets = Array.isArray(referral.target_hospitals)
          ? referral.target_hospitals
          : [];

        const enrichedTargets = await Promise.all(
          targets.map(async (target) => {
            const facilityId =
              typeof target === 'string'
                ? target
                : target?.facility_id;

            if (!facilityId) {
              return target;
            }

            const facility = await Facility.findOne({
              facility_id: facilityId
            }).lean();

            if (!facility) {
              return target;
            }

            const match = await scoreFacility(facility, {
              specialty: referral.specialty_required || ''
            });

            return {
              ...target,
              facility_id: facility.facility_id,
              facility: facility.name,
              type: facility.type,
              district: facility.district,
              distance: `${facility.distance_km} km`,
              match_score: match.match_score,
              reasons: match.reasons,
              available_beds: match.available_beds,
              available_icu_beds: match.available_icu_beds
            };
          })
        );

        return {
          ...referral,
          target_hospitals: enrichedTargets
        };
      })
    );

    res.json({
      referrals: sanitizeArray(enrichedReferrals)
    });
  } catch (error) {
    console.error('Referral retrieval error:', error);

    res.status(500).json({
      error: 'Unable to load referrals'
    });
  }
});

app.post('/api/referrals',
  authenticate,
  allow('health_worker', 'doctor'),
  async (req, res) => {
    try {
      const {
        patient_id,
        specialty_required = '',
        clinical_notes = '',
        priority = 'NORMAL',
        target_hospitals = []
      } = req.body || {};

      if (!patient_id) {
        return res.status(400).json({
          error: 'Patient ID is required'
        });
      }

      // Automatically find the best destination hospitals
      // when the frontend does not provide them.
      let recommendedHospitals = target_hospitals;

      if (!Array.isArray(recommendedHospitals) || recommendedHospitals.length === 0) {
        const facilities = await Facility.find().lean();

        const matches = await Promise.all(
          facilities.map((facility) =>
            scoreFacility(facility, {
              specialty: specialty_required
            })
          )
        );

        recommendedHospitals = matches
          .sort((a, b) => b.match_score - a.match_score)
          .slice(0, 3)
          .map((match) => ({
            facility_id: match.facility_id,
            facility: match.facility,
            type: match.type,
            district: match.district,
            distance: match.distance,
            match_score: match.match_score,
            reasons: match.reasons,
            available_beds: match.available_beds,
            available_icu_beds: match.available_icu_beds
          }));
      }

      const targetFacilityId = req.body.target_facility_id || req.body.destination_facility_id || recommendedHospitals[0]?.facility_id || '';
      const targetFacilityName = req.body.target_facility_name || req.body.destination_facility_name || recommendedHospitals[0]?.facility || '';

      const referral = await Referral.create({
        ...req.body,
        referral_id: `REF-${Date.now().toString().slice(-6)}`,
        patient_id,
        specialty_required,
        clinical_notes,
        priority,
        target_facility_id: targetFacilityId,
        target_facility_name: targetFacilityName,
        destination_facility_id: targetFacilityId,
        destination_facility_name: targetFacilityName,
        status: 'SENT',
        created_at: new Date().toISOString(),
        referring_facility_id: req.user.facility_id,
        referring_facility_name: req.user.facility_name || '',
        referring_worker: req.user.name || '',
        target_hospitals: recommendedHospitals
      });

      await audit(
        req.user,
        'REFERRAL_CREATION',
        'AUTHORIZED',
        referral.patient_id
      );

      res.status(201).json({
        referral: sanitizeDoc(referral)
      });
    } catch (error) {
      console.error('Referral creation error:', error);

      res.status(500).json({
        error: 'Unable to create referral'
      });
    }
  }
);

app.patch('/api/referrals/:referralId/decision', authenticate, allow('facility_admin', 'doctor'), async (req, res) => {
  const existingReferral = await Referral.findOne({ referral_id: req.params.referralId }).lean();
  if (!existingReferral) return res.status(404).json({ error: 'Referral not found' });

  if (req.user.role === 'facility_admin' && existingReferral.target_facility_id && existingReferral.target_facility_id !== req.user.facility_id) {
    return res.status(403).json({ error: 'Unauthorized: Referral target facility does not match your facility' });
  }

  const isAccepted = req.body.status === 'ACCEPTED' || req.body.decision === 'ACCEPTED' || req.body.action === 'ACCEPT';
  const status = isAccepted ? 'ACCEPTED' : 'REJECTED';
  const reason = req.body.reason || req.body.notes || '';

  const referral = await Referral.findOneAndUpdate(
    { referral_id: req.params.referralId },
    {
      $set: {
        status,
        decision_reason: reason,
        accepted_facility_id: isAccepted ? req.user.facility_id : undefined,
        accepted_facility_name: isAccepted ? (req.user.facility_name || 'Hospital Admin') : undefined,
        accepted_hospital: isAccepted ? (req.user.facility_name || 'Hospital Admin') : undefined,
        accepted_by: isAccepted ? req.user.user_id : undefined,
        accepted_by_name: isAccepted ? req.user.name : undefined,
        accepted_at: isAccepted ? new Date().toISOString() : undefined,
        rejected_by: !isAccepted ? req.user.user_id : undefined,
        rejected_at: !isAccepted ? new Date().toISOString() : undefined
      }
    },
    { returnDocument: 'after' }
  ).lean();

  if (!referral) return res.status(404).json({ error: 'Referral not found' });
  await audit(req.user, `REFERRAL_${status}`, 'AUTHORIZED', referral.patient_id, `Decision: ${status}`);

  if (referral.patient_id) {
    await createTargetedNotification({
      recipient_user_id: referral.patient_id,
      recipient_role: 'patient',
      title: `Referral ${status}`,
      message: `Your referral (${referral.referral_id}) has been ${status.toLowerCase()} by ${req.user.facility_name || 'destination facility'}.${reason ? ` Reason: ${reason}` : ''}`,
      type: isAccepted ? 'SUCCESS' : 'WARNING',
      related_entity_type: 'REFERRAL',
      related_entity_id: referral.referral_id,
      link: '/patient/referrals'
    });
  }

  if (referral.referring_worker) {
    await createTargetedNotification({
      recipient_user_id: referral.referring_worker,
      recipient_role: 'health_worker',
      title: `Referral ${status}`,
      message: `Referral ${referral.referral_id} for ${referral.patient_name || referral.patient_id} was ${status.toLowerCase()} by ${req.user.facility_name || 'facility'}.${reason ? ` Reason: ${reason}` : ''}`,
      type: isAccepted ? 'SUCCESS' : 'WARNING',
      related_entity_type: 'REFERRAL',
      related_entity_id: referral.referral_id,
      link: '/health-worker/referrals'
    });
  }

  res.json({ referral: sanitizeDoc(referral) });
});

app.get('/api/medicines', authenticate, async (req, res) => {
  let filter = {};
  if (req.query.facility_id) {
    filter.facility_id = req.query.facility_id;
  } else if (req.user.role === 'facility_admin') {
    filter.facility_id = req.user.facility_id;
  } else if (req.user.role === 'district_authority') {
    const rawDistrict = req.user.district || req.user.jurisdiction || 'Pune';
    const canonicalDistrict = rawDistrict.replace(/\s+District$/i, '').trim();
    const districtFacs = await Facility.find({ district: new RegExp(`^${canonicalDistrict}$`, 'i') }).select('facility_id').lean();
    const districtFacIds = districtFacs.map(f => f.facility_id);
    filter.facility_id = { $in: districtFacIds };
  }
  const medicines = await Medicine.find(filter).lean();
  res.json({ medicines: sanitizeArray(medicines) });
});

app.patch('/api/medicines/:medicineId', authenticate, allow('facility_admin', 'district_authority'), async (req, res) => {
  const medicine = await Medicine.findOne({ medicine_id: req.params.medicineId }).lean();
  if (!medicine) return res.status(404).json({ error: 'Medicine record not found' });
  if (req.user.role === 'facility_admin' && medicine.facility_id && medicine.facility_id !== req.user.facility_id) {
    return res.status(403).json({ error: 'Unauthorized to update another facility medicine stock' });
  }
  const currentStock = req.body.current_stock !== undefined ? Number(req.body.current_stock) : medicine.current_stock;
  const minStock = req.body.min_safety_stock !== undefined ? Number(req.body.min_safety_stock) : (medicine.min_safety_stock || 10);
  let status = 'AVAILABLE';
  if (currentStock === 0) status = 'OUT_OF_STOCK';
  else if (currentStock <= minStock) status = 'CRITICAL';
  else if (currentStock <= minStock * 1.5) status = 'LOW_STOCK';

  const updatedMedicine = await Medicine.findOneAndUpdate(
    { medicine_id: req.params.medicineId },
    { $set: { ...req.body, current_stock: currentStock, status, updated_at: new Date() } },
    { returnDocument: 'after' }
  ).lean();

  await audit(req.user, 'MEDICINE_STOCK_UPDATED', 'AUTHORIZED', null, `${updatedMedicine.name}: ${currentStock} (${status})`);
  res.json({ medicine: sanitizeDoc(updatedMedicine) });
});

app.get('/api/doctors', authenticate, async (req, res) => {
  let filter = { role: 'doctor' };
  if (req.query.facility_id) {
    filter.facility_id = req.query.facility_id;
  } else if (req.user.role === 'facility_admin') {
    filter.facility_id = req.user.facility_id;
  }
  const doctors = await User.find(filter).lean();
  res.json({ doctors: doctors.map(publicUser) });
});

app.get('/api/staff', authenticate, async (req, res) => {
  let filter = { role: { $in: ['doctor', 'health_worker', 'facility_admin'] } };
  const facilityId = req.query.facility_id || (req.user.role === 'facility_admin' ? req.user.facility_id : null);
  if (facilityId) {
    filter.facility_id = facilityId;
  }
  const staff = await User.find(filter).lean();
  res.json({ staff: staff.map(publicUser) });
});

app.patch('/api/doctors/:userId/availability', authenticate, allow('facility_admin', 'doctor'), async (req, res) => {
  const targetUser = await User.findOne({ user_id: req.params.userId, role: 'doctor' }).lean();
  if (!targetUser) return res.status(404).json({ error: 'Doctor not found' });
  if (req.user.role === 'facility_admin' && targetUser.facility_id && targetUser.facility_id !== req.user.facility_id) {
    return res.status(403).json({ error: 'Unauthorized to update doctor at another facility' });
  }

  const updatedDoctor = await User.findOneAndUpdate(
    { user_id: req.params.userId },
    {
      $set: {
        availability_status: req.body.availability_status || req.body.status || targetUser.availability_status || 'AVAILABLE',
        availability_schedule: req.body.availability_schedule || targetUser.availability_schedule,
        specialty: req.body.specialty || targetUser.specialty,
        phone: req.body.phone || targetUser.phone,
        last_availability_update: new Date().toISOString()
      }
    },
    { returnDocument: 'after' }
  ).lean();

  await audit(req.user, 'DOCTOR_AVAILABILITY_UPDATED', 'AUTHORIZED', null, `Doctor ${updatedDoctor.name}: ${updatedDoctor.availability_status}`);
  res.json({ doctor: publicUser(updatedDoctor) });
});

app.get('/api/equipment', authenticate, async (req, res) => {
  let filter = {};
  if (req.query.facility_id) {
    filter.facility_id = req.query.facility_id;
  } else if (req.user.role === 'facility_admin') {
    filter.facility_id = req.user.facility_id;
  }
  const equipment = await Equipment.find(filter).lean();
  res.json({ equipment: sanitizeArray(equipment) });
});

app.patch('/api/equipment/:equipmentId', authenticate, allow('facility_admin'), async (req, res) => {
  const eq = await Equipment.findOne({ equipment_id: req.params.equipmentId }).lean();
  if (!eq) return res.status(404).json({ error: 'Equipment not found' });
  if (eq.facility_id && eq.facility_id !== req.user.facility_id) return res.status(403).json({ error: 'Unauthorized' });

  const updatedEq = await Equipment.findOneAndUpdate(
    { equipment_id: req.params.equipmentId },
    { $set: { ...req.body, updated_at: new Date() } },
    { returnDocument: 'after' }
  ).lean();

  await audit(req.user, 'EQUIPMENT_UPDATED', 'AUTHORIZED', null, `${updatedEq.name}: ${updatedEq.status}`);
  res.json({ equipment: sanitizeDoc(updatedEq) });
});

app.patch('/api/diagnostics/:testId', authenticate, allow('facility_admin'), async (req, res) => {
  const diag = await Diagnostic.findOne({ test_id: req.params.testId }).lean();
  if (!diag) return res.status(404).json({ error: 'Diagnostic service not found' });
  if (diag.facility_id && diag.facility_id !== req.user.facility_id) return res.status(403).json({ error: 'Unauthorized' });

  const updatedDiag = await Diagnostic.findOneAndUpdate(
    { test_id: req.params.testId },
    { $set: req.body },
    { returnDocument: 'after' }
  ).lean();

  await audit(req.user, 'DIAGNOSTIC_SERVICE_UPDATED', 'AUTHORIZED', null, `${updatedDiag.name}: ${updatedDiag.status}`);
  res.json({ diagnostic: sanitizeDoc(updatedDiag) });
});


app.get('/api/diagnostics', authenticate, async (_req, res) => {
  const diagnostics = await Diagnostic.find().lean();
  res.json({ diagnostics: sanitizeArray(diagnostics) });
});

app.get('/api/audit', authenticate, allow('district_authority', 'facility_admin'), async (_req, res) => {
  const logs = await AuditLog.find().sort({ timestamp: -1 }).lean();
  res.json({ logs: sanitizeArray(logs) });
});

app.post('/api/sync', authenticate, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  const results = items.map((item) => ({ local_id: item.local_id, status: 'SYNCED' }));
  await audit(req.user, 'SYNC', 'AUTHORIZED', null, `${results.length} item(s)`);
  res.json({ results, synced_at: new Date().toISOString() });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'Unexpected server error' });
});

async function startServer() {
  const connected = await initializeDatabase();
  if (!connected) {
    console.error('Failed to connect to MongoDB. Exiting.');
    process.exit(1);
  }

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('No users found in MongoDB. Auto-seeding initial dataset...');
    await seedDatabase();
  }

  app.listen(port, () => {
    console.log(`Maha Health Connect API listening on http://localhost:${port}`);
  });
}

const gracefulShutdown = async () => {
  await closeDatabase();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

startServer().catch((error) => {
  console.error(`Server initialization failed: ${error.message}`);
  process.exit(1);
});
