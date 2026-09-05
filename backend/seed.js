import 'dotenv/config';
import bcrypt from 'bcryptjs';

import { initializeDatabase } from './database.js';
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
  Consultation
} from './models/index.js';

import { generateSyntheticNetwork } from './syntheticDataGenerator.js';

const DEMO_PASSWORDS = {
  doctor: 'doctor123',
  health_worker: 'worker123',
  facility_admin: 'admin123',
  patient: 'patient123',
  district_authority: 'district123'
};

export async function seedDatabase() {
  console.log('\n========================================');
  console.log(' MAHA HEALTH CONNECT');
  console.log(' Synthetic Database Generator');
  console.log('========================================\n');

  await initializeDatabase();

  console.log('Generating synthetic healthcare network...\n');

  const data = generateSyntheticNetwork();

  console.log('Generated:');
  console.log(`  Facilities       : ${data.facilities.length}`);
  console.log(`  Doctors          : ${data.doctors.length}`);
  console.log(`  Patients         : ${data.patients.length}`);
  console.log(`  Health Workers   : ${data.healthWorkers.length}`);
  console.log(`  Facility Admins  : ${data.facilityAdmins.length}`);
  console.log(`  Beds             : ${data.beds.length}`);
  console.log(`  Equipment        : ${data.equipment.length}`);
  console.log(`  Medicines        : ${data.medicines.length}`);
  console.log(`  Diagnostics      : ${data.diagnostics.length}`);
  console.log(`  Appointments     : ${data.appointments.length}`);
  console.log(`  Triage Records   : ${data.triages.length}`);
  console.log(`  Referrals        : ${data.referrals.length}`);
  console.log(`  Consultations    : ${data.consultations.length}`);
  console.log(`  Prescriptions    : ${data.prescriptions.length}`);
  console.log(`  Diagnostic Orders: ${data.diagnosticOrders.length}`);
  console.log(`  Follow-ups       : ${data.followups.length}`);
  console.log(`  Audit Logs       : ${data.auditLogs.length}\n`);

  /*
   * ---------------------------------------------------------
   * CLEAR EXISTING SYNTHETIC DATA
   * ---------------------------------------------------------
   */

  console.log('Clearing previous seeded data...');

  await Promise.all([
    User.deleteMany({}),
    Patient.deleteMany({}),
    Facility.deleteMany({}),
    Appointment.deleteMany({}),
    Triage.deleteMany({}),
    Referral.deleteMany({}),
    Prescription.deleteMany({}),
    Diagnostic.deleteMany({}),
    DiagnosticOrder.deleteMany({}),
    Followup.deleteMany({}),
    Medicine.deleteMany({}),
    Equipment.deleteMany({}),
    Bed.deleteMany({}),
    AuditLog.deleteMany({}),
    Consultation.deleteMany({})
  ]);

  /*
   * ---------------------------------------------------------
   * FACILITIES
   * ---------------------------------------------------------
   */

  console.log('Seeding facilities...');

  await Facility.insertMany(data.facilities);

  /*
   * ---------------------------------------------------------
   * USERS
   * ---------------------------------------------------------
   */

  console.log('Seeding users...');

  const userRecords = [];

  // Doctors
  for (const doctor of data.doctors) {
    userRecords.push({
      ...doctor,
      passwordHash: await bcrypt.hash(
        DEMO_PASSWORDS.doctor,
        10
      )
    });
  }

  // Health workers
  for (const worker of data.healthWorkers) {
    userRecords.push({
      ...worker,
      passwordHash: await bcrypt.hash(
        DEMO_PASSWORDS.health_worker,
        10
      )
    });
  }

  // Facility administrators
  for (const admin of data.facilityAdmins) {
    userRecords.push({
      ...admin,
      passwordHash: await bcrypt.hash(
        DEMO_PASSWORDS.facility_admin,
        10
      )
    });
  }

  /*
   * Preserve district authority demo login.
   */
  userRecords.push({
    user_id: 'USR-DST-001',
    role: 'district_authority',
    name: 'District Health Officer',
    name_mr: 'जिल्हा आरोग्य अधिकारी',
    designation: 'District Health Officer',
    district: 'Pune',
    jurisdiction: 'Pune District',
    passwordHash: await bcrypt.hash(
      DEMO_PASSWORDS.district_authority,
      10
    ),
    created_at: new Date().toISOString()
  });

  /*
   * Preserve patient demo login.
   */
  userRecords.push({
    user_id: 'USR-PAT-001',
    role: 'patient',
    name: data.patients[0]?.name || 'Rajesh Patil',
    patient_id: data.patients[0]?.patient_id || 'PAT-10245',
    passwordHash: await bcrypt.hash(
      DEMO_PASSWORDS.patient,
      10
    ),
    created_at: new Date().toISOString()
  });

  await User.insertMany(userRecords);

  /*
   * ---------------------------------------------------------
   * PATIENTS
   * ---------------------------------------------------------
   */

  console.log('Seeding patients...');

  await Patient.insertMany(data.patients);

  /*
   * ---------------------------------------------------------
   * BEDS
   * ---------------------------------------------------------
   */

  console.log('Seeding bed availability...');

  await Bed.insertMany(data.beds);

  /*
   * ---------------------------------------------------------
   * EQUIPMENT
   * ---------------------------------------------------------
   */

  console.log('Seeding equipment...');

  await Equipment.insertMany(data.equipment);

  /*
   * ---------------------------------------------------------
   * MEDICINES
   * ---------------------------------------------------------
   */

  console.log('Seeding medicine inventory...');

  await Medicine.insertMany(data.medicines);

  /*
   * ---------------------------------------------------------
   * DIAGNOSTICS
   * ---------------------------------------------------------
   */

  console.log('Seeding diagnostic services...');

  await Diagnostic.insertMany(data.diagnostics);

  /*
   * ---------------------------------------------------------
   * APPOINTMENTS
   * ---------------------------------------------------------
   */

  console.log('Seeding appointments...');

  await Appointment.insertMany(data.appointments);

  /*
   * ---------------------------------------------------------
   * TRIAGE
   * ---------------------------------------------------------
   */

  console.log('Seeding triage records...');

  await Triage.insertMany(data.triages);

  /*
   * ---------------------------------------------------------
   * REFERRALS
   * ---------------------------------------------------------
   */

  console.log('Seeding referrals...');

  await Referral.insertMany(data.referrals);

  /*
   * ---------------------------------------------------------
   * CONSULTATIONS
   * ---------------------------------------------------------
   */

  console.log('Seeding consultations...');

  await Consultation.insertMany(data.consultations);

  /*
   * ---------------------------------------------------------
   * PRESCRIPTIONS
   * ---------------------------------------------------------
   */

  console.log('Seeding prescriptions...');

  await Prescription.insertMany(data.prescriptions);

  /*
   * ---------------------------------------------------------
   * DIAGNOSTIC ORDERS
   * ---------------------------------------------------------
   */

  console.log('Seeding diagnostic orders...');

  await DiagnosticOrder.insertMany(data.diagnosticOrders);

  /*
   * ---------------------------------------------------------
   * FOLLOW-UPS
   * ---------------------------------------------------------
   */

  console.log('Seeding follow-ups...');

  await Followup.insertMany(data.followups);

  /*
   * ---------------------------------------------------------
   * AUDIT LOGS
   * ---------------------------------------------------------
   */

  console.log('Seeding audit logs...');

  await AuditLog.insertMany(data.auditLogs);

  /*
   * ---------------------------------------------------------
   * SUMMARY
   * ---------------------------------------------------------
   */

  console.log('\n========================================');
  console.log(' MongoDB Seeding Complete!');
  console.log('========================================\n');

  console.log('Central synthetic healthcare network is ready.\n');

  console.log('Demo login passwords:');
  console.log('  Patient          : patient123');
  console.log('  Health Worker    : worker123');
  console.log('  Doctor           : doctor123');
  console.log('  Facility Admin   : admin123');
  console.log('  District Authority: district123');

  console.log('\nImportant demo accounts:');
  console.log('  Doctor: USR-DOC-003');
  console.log('  Patient: USR-PAT-001');

  console.log('\nNext step: verify MongoDB record counts.\n');

  process.exit(0);
}

import { fileURLToPath } from 'url';

const isMainModule =
  process.argv[1] &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMainModule) {
  seedDatabase()
    .then(() => {
      console.log('\nSeed script finished successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ SEEDING FAILED');
      console.error(error);
      process.exit(1);
    });
}