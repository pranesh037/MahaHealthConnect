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
  AccessGrant
} from './models/index.js';

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'maha-health-connect-demo-secret';

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || true }));
app.use(express.json({ limit: '1mb' }));

const sanitizeDoc = (doc) => {
  if (!doc) return doc;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
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
  if (user.role === 'health_worker') return !clinical && (!user.facility_id || user.facility_id === (patient.registered_facility_id || 'FAC-101'));
  if (user.role === 'doctor') {
    const now = new Date();

    const grant = await AccessGrant.findOne({
      patient_id: patient.patient_id,
      doctor_id: user.user_id,
      status: 'ACTIVE',
      starts_at: { $lte: now },
      expires_at: { $gt: now }
    }).lean();

    return Boolean(grant);
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

  const query = {};
  if (role) query.role = role;

  const user = await User.findOne({
    ...query,
    $or: [
      { user_id: searchStr },
      { phone: searchStr },
      { email: searchStr.toLowerCase() },
      { employee_id: searchStr },
      { name: new RegExp(`^${escapedStr}$`, 'i') }
    ]
  }).lean();

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
        registered_facility_id: facility_id || 'FAC-101',
        registered_by: userId,
        registered_at: new Date().toISOString(),
        triage_status: 'ROUTINE',
        triage_reason: 'Self Registered Citizen',
        medical_info: {
          blood_group: blood_group || 'O+',
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
      delete clean.medical_info;
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
  const patientData = {
    ...payload,
    patient_id,
    registered_facility_id: req.user.facility_id || 'FAC-101',
    registered_by: req.user.name,
    registered_at: new Date().toISOString(),
    record_version: 1
  };

  const patient = await Patient.create(patientData);
  await audit(req.user, 'PATIENT_REGISTRATION', 'AUTHORIZED', patient_id);
  res.status(201).json({ patient: sanitizeDoc(patient) });
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
    reason,
    facility_id: req.user.facility_id,
    health_worker_id: req.user.user_id,
    created_at: new Date().toISOString(),
    sync_status: 'SYNCED'
  });

  await Patient.findOneAndUpdate({ patient_id }, { $set: { triage_status: priority, triage_reason: reason } });
  await audit(req.user, 'TRIAGE', 'AUTHORIZED', patient_id, priority);
  res.status(201).json({ triage: sanitizeDoc(record) });
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

app.get('/api/facilities', authenticate, async (_req, res) => {
  const facilities = await Facility.find().lean();
  res.json({ facilities: sanitizeArray(facilities) });
});

app.patch('/api/facilities/:facilityId/resources', authenticate, allow('facility_admin'), async (req, res) => {
  const facility = await Facility.findOne({ facility_id: req.params.facilityId }).lean();
  if (!facility || facility.facility_id !== req.user.facility_id) {
    return res.status(403).json({ error: 'Facility resource access denied' });
  }

  const updatedFacility = await Facility.findOneAndUpdate(
    { facility_id: req.params.facilityId },
    { $set: { ...req.body, last_verified: 'Just now' } },
    { returnDocument: 'after' }
  ).lean();

  await audit(req.user, 'FACILITY_RESOURCES_UPDATED', 'AUTHORIZED', null, 'Beds, medicines, equipment, diagnostics, or doctor availability');
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

app.post('/api/appointments', authenticate, allow('patient', 'health_worker'), async (req, res) => {
  const appointment = await Appointment.create({
    ...req.body,
    appointment_id: `APT-${Date.now().toString().slice(-6)}`,
    status: 'BOOKED',
    created_at: new Date().toISOString()
  });
  await audit(req.user, 'APPOINTMENT_CREATED', 'AUTHORIZED', appointment.patient_id);
  res.status(201).json({ appointment: sanitizeDoc(appointment) });
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

app.post('/api/prescriptions', authenticate, allow('doctor'), async (req, res) => {
  const prescription = await Prescription.create({
    ...req.body,
    prescription_id: `RX-${Date.now().toString().slice(-6)}`,
    doctor_id: req.user.user_id,
    created_at: new Date().toISOString()
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
  await audit(req.user, 'DIAGNOSTIC_ORDER_CREATED', 'AUTHORIZED', order.patient_id);
  res.status(201).json({ order: sanitizeDoc(order) });
});

app.get('/api/diagnostics/orders', authenticate, async (req, res) => {
  const filter = req.user.role === 'patient'
    ? { patient_id: req.user.patient_id }
    : req.user.role === 'doctor'
    ? { doctor_id: req.user.user_id }
    : {};
  const orders = await DiagnosticOrder.find(filter).lean();
  res.json({ orders: sanitizeArray(orders) });
});

app.patch('/api/diagnostics/orders/:orderId', authenticate, allow('facility_admin', 'doctor'), async (req, res) => {
  const updateData = {};
  if (req.body.status) updateData.status = req.body.status;
  if (req.body.result) updateData.result = req.body.result;

  const order = await DiagnosticOrder.findOneAndUpdate(
    { order_id: req.params.orderId },
    { $set: updateData },
    { returnDocument: 'after' }
  ).lean();

  if (!order) return res.status(404).json({ error: 'Diagnostic order not found' });
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

app.get('/api/referrals', authenticate, async (req, res) => {
  try {
    const filter =
      req.user.role === 'patient'
        ? { patient_id: req.user.patient_id }
        : {};

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

      const referral = await Referral.create({
        ...req.body,
        referral_id: `REF-${Date.now().toString().slice(-6)}`,
        patient_id,
        specialty_required,
        clinical_notes,
        priority,
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
  const isAccepted = req.body.status === 'ACCEPTED' || req.body.action === 'ACCEPT';
  const status = isAccepted ? 'ACTIVE' : 'REJECTED';
  const reason = req.body.reason || req.body.notes || '';

  const referral = await Referral.findOneAndUpdate(
    { referral_id: req.params.referralId },
    {
      $set: {
        status,
        decision_reason: reason,
        accepted_facility_id: isAccepted ? req.user.facility_id : undefined,
        accepted_facility_name: isAccepted ? (req.user.facility_name || 'Hospital Admin') : undefined
      }
    },
    { returnDocument: 'after' }
  ).lean();

  if (!referral) return res.status(404).json({ error: 'Referral not found' });
  await audit(req.user, `REFERRAL_${status}`, 'AUTHORIZED', referral.patient_id, `Decision: ${status}`);
  res.json({ referral: sanitizeDoc(referral) });
});

app.get('/api/medicines', authenticate, async (_req, res) => {
  const medicines = await Medicine.find().lean();
  res.json({ medicines: sanitizeArray(medicines) });
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
