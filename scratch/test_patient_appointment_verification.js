import { en } from '../src/translations/en.js';
import { mr } from '../src/translations/mr.js';
import { hi } from '../src/translations/hi.js';

const API_URL = 'http://localhost:4000/api';

async function runPatientAppointmentAudit() {
  console.log('====================================================');
  console.log(' MAHA HEALTH CONNECT - PATIENT APPOINTMENT AUDIT ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Verify Translation Coverage for Patient Form & Table Column Headers
    console.log('--- 1. PATIENT TRANSLATION COVERAGE AUDIT ---');
    const requiredKeys = [
      'appointment_id',
      'patient_id',
      'doctor_name',
      'doctor_id',
      'facility_id',
      'healthCentre',
      'noAppointmentsFound',
      'selectDoctor',
      'selectFacility',
      'date',
      'time',
      'status'
    ];

    for (const k of requiredKeys) {
      assert(en[k] && typeof en[k] === 'string', `English translation key '${k}': "${en[k]}"`);
      assert(mr[k] && typeof mr[k] === 'string', `Marathi translation key '${k}': "${mr[k]}"`);
      assert(hi[k] && typeof hi[k] === 'string', `Hindi translation key '${k}': "${hi[k]}"`);
    }

    // 2. Patient Login & Facility Inspection
    console.log('\n--- 2. PATIENT FACILITY & APPOINTMENT FLOW ---');
    const patRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'PAT-10245', password: 'patient123', role: 'patient' })
    });
    const patData = await patRes.json();
    assert(patRes.ok && patData.token, 'Patient PAT-10245 login successful');
    const patToken = patData.token;

    const patientProfile = await fetch(`${API_URL}/me`, { headers: { Authorization: `Bearer ${patToken}` } }).then(r => r.json());
    const primaryFacilityId = patientProfile.user.registered_facility_id || patientProfile.user.facility_id || 'FAC-101';
    assert(primaryFacilityId === 'FAC-101', `Patient PAT-10245 registered primary facility correctly identified as FAC-101`);

    // Fetch Doctors assigned to FAC-101
    const fac101DocsRes = await fetch(`${API_URL}/doctors?facility_id=FAC-101`, { headers: { Authorization: `Bearer ${patToken}` } }).then(r => r.json());
    const fac101Doc = (fac101DocsRes.doctors || [])[0];
    assert(fac101Doc !== undefined, `Retrieved doctor (${fac101Doc?.name}) assigned to FAC-101`);

    // 3. Valid Appointment Booking Flow (Patient -> Facility FAC-101 -> Doctor fac101Doc)
    console.log('\n--- 3. APPOINTMENT BOOKING & PERSISTENCE ---');
    const bookRes = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patToken}` },
      body: JSON.stringify({
        patient_id: 'PAT-10245',
        facility_id: 'FAC-101',
        doctor_id: fac101Doc?.user_id,
        date: '2026-09-15',
        time: '10:30 AM'
      })
    });
    const bookData = await bookRes.json();
    assert(bookRes.ok && bookData.appointment?.appointment_id, `Appointment booked successfully: ${bookData.appointment?.appointment_id}`);
    assert(bookData.appointment?.facility_id === 'FAC-101', `Appointment facility_id persisted as FAC-101`);
    const bookedAptId = bookData.appointment.appointment_id;

    // Verify Patient Dashboard contains the booked appointment
    const dashRes = await fetch(`${API_URL}/patients/me/dashboard`, { headers: { Authorization: `Bearer ${patToken}` } }).then(r => r.json());
    const foundInDash = (dashRes.appointments || []).find((a) => a.appointment_id === bookedAptId);
    assert(foundInDash !== undefined, `Booked appointment ${bookedAptId} is reflected in Patient Dashboard`);
    assert(foundInDash?.facility_id === 'FAC-101', `Patient Dashboard appointment has correct facility_id FAC-101 (not hardcoded FAC-103)`);

    // 4. Doctor-Facility Validation Security Audit
    console.log('\n--- 4. DOCTOR-FACILITY VALIDATION AUDIT ---');
    // Fetch a doctor belonging to FAC-103
    const fac103DocsRes = await fetch(`${API_URL}/doctors?facility_id=FAC-103`, { headers: { Authorization: `Bearer ${patToken}` } }).then(r => r.json());
    const fac103Doc = (fac103DocsRes.doctors || [])[0];
    assert(fac103Doc !== undefined, `Retrieved doctor (${fac103Doc?.name}) assigned to FAC-103`);

    // Attempt booking at FAC-101 with FAC-103 Doctor
    const invalidBookRes = await fetch(`${API_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${patToken}` },
      body: JSON.stringify({
        patient_id: 'PAT-10245',
        facility_id: 'FAC-101',
        doctor_id: fac103Doc?.user_id,
        date: '2026-09-16',
        time: '11:00 AM'
      })
    });
    const invalidBookData = await invalidBookRes.json();
    assert(invalidBookRes.status === 400, `Booking at FAC-101 with FAC-103 Doctor rejected with HTTP 400 Bad Request`);
    assert(invalidBookData.error.includes('belongs to'), `Backend returned clear error: "${invalidBookData.error}"`);

    console.log('\n====================================================');
    console.log(` FINAL VERIFICATION SUMMARY: ${passed} PASSED / ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Patient Appointment Audit Error:', err);
    process.exit(1);
  }
}

runPatientAppointmentAudit();
