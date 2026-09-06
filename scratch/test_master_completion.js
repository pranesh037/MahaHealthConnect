const API_BASE = 'http://localhost:4000/api';

async function runMasterTests() {
  console.log('============================================================');
  console.log(' MAHA HEALTH CONNECT - MASTER INTEGRATION & COMPLIANCE TEST ');
  console.log('============================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition, testName, detail = '') {
    totalCount++;
    if (condition) {
      passedCount++;
      console.log(`[PASS] ${testName} ${detail ? `- ${detail}` : ''}`);
    } else {
      console.error(`[FAIL] ${testName} ${detail ? `- ${detail}` : ''}`);
    }
  }

  // ------------------------------------------------------------
  // TEST A & B: Sign Up & New Doctor Login
  // ------------------------------------------------------------
  console.log('--- PART 1: User Registration & Authentication ---');
  const uniquePhone = `987${Math.floor(100000 + Math.random() * 899999)}`;
  const regDoctorPayload = {
    role: 'doctor',
    name: 'Dr. Final Integration Specialist',
    phone: uniquePhone,
    email: `finaldoc${Math.floor(1000 + Math.random() * 8999)}@maha.gov.in`,
    password: 'docpassword123',
    specialty: 'Cardiology',
    facility_name: 'District Hospital Aundh'
  };

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regDoctorPayload)
  });
  const regData = await regRes.json();
  assert(regRes.status === 201 && regData.token && regData.user.user_id, 'TEST A: User Registration (POST /api/auth/register)', `user_id=${regData?.user?.user_id}`);

  // Login with new user
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: uniquePhone,
      password: regDoctorPayload.password,
      role: 'doctor'
    })
  });
  const loginData = await loginRes.json();
  const docToken = loginData.token;
  assert(loginRes.status === 200 && docToken && loginData.user.role === 'doctor', 'TEST B: New User Login (POST /api/auth/login)', `role=${loginData?.user?.role}`);

  // ------------------------------------------------------------
  // TEST C: Session Restoration (/api/me)
  // ------------------------------------------------------------
  const meRes = await fetch(`${API_BASE}/me`, {
    headers: { Authorization: `Bearer ${docToken}` }
  });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.user.user_id === regData.user.user_id, 'TEST C: Session Restoration (GET /api/me)', `name=${meData?.user?.name}`);

  // ------------------------------------------------------------
  // TEST D: All Five Demo Account Logins
  // ------------------------------------------------------------
  console.log('\n--- PART 2: All 5 Role Logins ---');
  const demoAccounts = [
    { role: 'doctor', username: 'USR-DOC-003', password: 'doctor123' },
    { role: 'health_worker', username: 'USR-WRK-001', password: 'worker123' },
    { role: 'facility_admin', username: 'USR-ADM-001', password: 'admin123' },
    { role: 'patient', username: 'USR-PAT-001', password: 'patient123' },
    { role: 'district_authority', username: 'USR-DST-001', password: 'district123' }
  ];

  const roleTokens = {};
  for (const acc of demoAccounts) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(acc)
    });
    const data = await res.json();
    if (res.status === 200 && data.token) {
      roleTokens[acc.role] = data.token;
    }
    assert(res.status === 200 && data.user.role === acc.role, `TEST D: Login as ${acc.role.toUpperCase()}`, `user_id=${data?.user?.user_id}`);
  }

  // ------------------------------------------------------------
  // TEST E: Smart Facility Matching
  // ------------------------------------------------------------
  console.log('\n--- PART 3: Healthcare Operations ---');
  const matchRes = await fetch(`${API_BASE}/facilities/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.health_worker}`
    },
    body: JSON.stringify({
      district: 'Pune',
      requiredSpecialties: ['Cardiology'],
      needsICU: true
    })
  });
  const matchData = await matchRes.json();
  assert(matchRes.status === 200 && Array.isArray(matchData.matches) && matchData.matches.length > 0, 'TEST E: Smart Facility Matching (POST /api/facilities/match)', `matches=${matchData?.matches?.length}`);

  // ------------------------------------------------------------
  // TEST F: Multi-Hospital Referral Workflow
  // ------------------------------------------------------------
  const refRes = await fetch(`${API_BASE}/referrals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.health_worker}`
    },
    body: JSON.stringify({
      patient_id: 'PAT-10245',
      patient_name: 'Rajesh Patil',
      source_facility_id: 'FAC-101',
      target_facility_ids: ['FAC-102', 'FAC-103'],
      reason: 'Urgent Cardiac Specialist Evaluation',
      priority: 'URGENT'
    })
  });
  const refData = await refRes.json();
  assert(refRes.status === 201 && refData.referral && refData.referral.referral_id, 'TEST F1: Create Multi-Hospital Referral', `referral_id=${refData?.referral?.referral_id}`);

  // Accept referral by Facility Admin
  const acceptRes = await fetch(`${API_BASE}/referrals/${refData.referral.referral_id}/decision`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.facility_admin}`
    },
    body: JSON.stringify({
      action: 'ACCEPT',
      notes: 'Bed reserved in ICU Ward B'
    })
  });
  const acceptData = await acceptRes.json();
  assert(acceptRes.status === 200 && acceptData.referral.status === 'ACTIVE', 'TEST F2: Accept Referral (PATCH /api/referrals/:id/decision)', `status=${acceptData?.referral?.status}`);

  // ------------------------------------------------------------
  // TEST G: Secure Time-Bound Doctor Access & Revocation
  // ------------------------------------------------------------
  console.log('\n--- PART 4: Secure Time-Bound Access ---');
  const grantRes = await fetch(`${API_BASE}/access-grants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.health_worker}`
    },
    body: JSON.stringify({
      patient_id: 'PAT-10245',
      doctor_id: 'USR-DOC-003',
      duration_minutes: 60,
      reason: 'Clinical Cardiology Consultation'
    })
  });
  const grantData = await grantRes.json();
  assert(grantRes.status === 201 && grantData.grant.status === 'ACTIVE', 'TEST G1: Create Time-Bound AccessGrant', `grant_id=${grantData?.grant?.grant_id}`);

  // Revoke grant
  const revokeRes = await fetch(`${API_BASE}/access-grants/${grantData.grant.grant_id}/revoke`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${roleTokens.health_worker}` }
  });
  const revokeData = await revokeRes.json();
  assert(revokeRes.status === 200 && revokeData.grant.status === 'REVOKED', 'TEST G2: Revoke AccessGrant (PATCH /api/access-grants/:id/revoke)', `status=${revokeData?.grant?.status}`);

  // ------------------------------------------------------------
  // TEST H-N: Patient Registration, Triage, Appointment, Consultation, Prescription, Diagnostic, Followup
  // ------------------------------------------------------------
  console.log('\n--- PART 5: Patient & Clinical Records ---');

  // H: Patient Registration
  const patientRes = await fetch(`${API_BASE}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.health_worker}`
    },
    body: JSON.stringify({
      name: 'Automated Test Patient',
      gender: 'Male',
      dob: '1985-08-20',
      phone: `912${Math.floor(100000 + Math.random() * 899999)}`,
      address: 'Lavale, Pune',
      village: 'Lavale',
      district: 'Pune',
      registered_facility_id: 'FAC-101'
    })
  });
  const patientData = await patientRes.json();
  assert(patientRes.status === 201 && patientData.patient.patient_id, 'TEST H: Register Patient (POST /api/patients)', `patient_id=${patientData?.patient?.patient_id}`);

  // I: Triage
  const triageRes = await fetch(`${API_BASE}/triage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.health_worker}`
    },
    body: JSON.stringify({
      patient_id: patientData.patient.patient_id,
      patient_name: patientData.patient.name,
      facility_id: 'FAC-101',
      symptoms: 'High blood pressure, headache',
      vitals: { systolic: 145, diastolic: 92, pulse: 82, temperature: 98.6, spo2: 98 },
      triage_priority: 'URGENT',
      notes: 'Initial checkup'
    })
  });
  const triageData = await triageRes.json();
  assert(triageRes.status === 201 && triageData.triage.triage_id, 'TEST I: Digital Triage (POST /api/triage)', `triage_id=${triageData?.triage?.triage_id}`);

  // J: Appointment
  const aptRes = await fetch(`${API_BASE}/appointments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.patient}`
    },
    body: JSON.stringify({
      patient_id: 'PAT-10245',
      doctor_id: 'USR-DOC-003',
      facility_id: 'FAC-103',
      facility_name: 'District Hospital Aundh',
      date: '2026-09-10',
      time: '10:30',
      type: 'IN_PERSON'
    })
  });
  const aptData = await aptRes.json();
  assert(aptRes.status === 201 && aptData.appointment.appointment_id, 'TEST J: Create Appointment (POST /api/appointments)', `appointment_id=${aptData?.appointment?.appointment_id}`);

  // K: Consultation
  const consultRes = await fetch(`${API_BASE}/consultations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.doctor}`
    },
    body: JSON.stringify({
      patient_id: 'PAT-10245',
      doctor_id: 'USR-DOC-003',
      facility_id: 'FAC-103',
      complaint: 'Chest discomfort',
      observations: 'Elevated BP 140/90',
      diagnosis: 'Mild Hypertension',
      notes: 'Advised sodium reduction'
    })
  });
  const consultData = await consultRes.json();
  assert(consultRes.status === 201 && consultData.consultation.consultation_id, 'TEST K: Save Consultation (POST /api/consultations)', `consultation_id=${consultData?.consultation?.consultation_id}`);

  // L: Prescription
  const rxRes = await fetch(`${API_BASE}/prescriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.doctor}`
    },
    body: JSON.stringify({
      patient_id: 'PAT-10245',
      doctor_id: 'USR-DOC-003',
      doctor_name: 'Dr. Aniket Deshmukh',
      facility_name: 'District Hospital Aundh',
      diagnosis: 'Hypertension',
      items: [{ medicine_name: 'Amlodipine 5mg', dosage: '1 tablet daily', duration_days: 30 }],
      instructions: 'Take after meals'
    })
  });
  const rxData = await rxRes.json();
  assert(rxRes.status === 201 && rxData.prescription.prescription_id, 'TEST L: Create Prescription (POST /api/prescriptions)', `prescription_id=${rxData?.prescription?.prescription_id}`);

  // M: Diagnostic Order
  const diagRes = await fetch(`${API_BASE}/diagnostics/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.doctor}`
    },
    body: JSON.stringify({
      patient_id: 'PAT-10245',
      doctor_id: 'USR-DOC-003',
      test_name: 'ECG',
      category: 'Cardiology',
      facility_id: 'FAC-103'
    })
  });
  const diagData = await diagRes.json();
  assert(diagRes.status === 201 && diagData.order.order_id, 'TEST M: Create Diagnostic Order (POST /api/diagnostics/orders)', `order_id=${diagData?.order?.order_id}`);

  // N: Followup
  const fupRes = await fetch(`${API_BASE}/followups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.doctor}`
    },
    body: JSON.stringify({
      patient_id: 'PAT-10245',
      doctor_id: 'USR-DOC-003',
      facility_id: 'FAC-103',
      followup_date: '2026-09-20',
      reason: 'Blood pressure review'
    })
  });
  const fupData = await fupRes.json();
  assert(fupRes.status === 201 && fupData.followup.followup_id, 'TEST N: Schedule Follow-up (POST /api/followups)', `followup_id=${fupData?.followup?.followup_id}`);

  // ------------------------------------------------------------
  // TEST O & P: Offline Sync & Audit Log
  // ------------------------------------------------------------
  console.log('\n--- PART 6: Sync & Audit Logs ---');
  const syncRes = await fetch(`${API_BASE}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.health_worker}`
    },
    body: JSON.stringify({
      items: [
        { type: 'triage', payload: { patient_id: 'PAT-10245', symptoms: 'Offline synced triage', vitals: { systolic: 120, diastolic: 80 } } }
      ]
    })
  });
  const syncData = await syncRes.json();
  assert(syncRes.status === 200 && Array.isArray(syncData.results), 'TEST O: Offline Sync Queue (POST /api/sync)', `processed=${syncData?.results?.length}`);

  const auditRes = await fetch(`${API_BASE}/audit`, {
    headers: { Authorization: `Bearer ${roleTokens.district_authority}` }
  });
  const auditData = await auditRes.json();
  assert(auditRes.status === 200 && Array.isArray(auditData.logs) && auditData.logs.length > 0, 'TEST P: Audit Log Retrieval (GET /api/audit)', `logsCount=${auditData?.logs?.length}`);

  // ------------------------------------------------------------

  // TEST Q-U: Teleconsultation, Attendance, Notifications, Escalations, Health Record
  // ------------------------------------------------------------
  console.log('\n--- PART 7: Extended Workflows & Interoperability ---');

  // Q: Teleconsultation Request & Status Update
  const teleRes = await fetch(`${API_BASE}/teleconsultations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.health_worker}`
    },
    body: JSON.stringify({
      patient_id: 'PAT-10245',
      doctor_id: 'USR-DOC-003',
      reason: 'Urgent Remote Consultation'
    })
  });
  const teleData = await teleRes.json();
  assert(teleRes.status === 201 && teleData.teleconsultation.teleconsultation_id, 'TEST Q1: Create Teleconsultation Request', `tele_id=${teleData?.teleconsultation?.teleconsultation_id}`);

  const teleApprove = await fetch(`${API_BASE}/teleconsultations/${teleData.teleconsultation.teleconsultation_id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.doctor}`
    },
    body: JSON.stringify({ status: 'APPROVED' })
  });
  const teleApproveData = await teleApprove.json();
  assert(teleApprove.status === 200 && teleApproveData.teleconsultation.status === 'APPROVED', 'TEST Q2: Doctor Approve Teleconsultation', `status=${teleApproveData?.teleconsultation?.status}`);

  // R: Attendance Check-in
  const attRes = await fetch(`${API_BASE}/attendance/check-in`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${roleTokens.doctor}` }
  });
  const attData = await attRes.json();
  assert(attRes.status === 201 || attRes.status === 400, 'TEST R: Doctor Attendance Check-in', `status=${attRes.status}`);

  // S: Notifications
  const notifRes = await fetch(`${API_BASE}/notifications`, {
    headers: { Authorization: `Bearer ${roleTokens.doctor}` }
  });
  const notifData = await notifRes.json();
  assert(notifRes.status === 200 && Array.isArray(notifData.notifications), 'TEST S: Targeted Notifications Retrieval', `count=${notifData?.notifications?.length}`);

  // T: Emergency Escalation
  const emgRes = await fetch(`${API_BASE}/emergency/escalate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${roleTokens.health_worker}`
    },
    body: JSON.stringify({
      patient_id: 'PAT-10245',
      target_facility_id: 'FAC-103',
      target_doctor_id: 'USR-DOC-003',
      reason: 'Acute Severe Respiratory Distress'
    })
  });
  const emgData = await emgRes.json();
  assert(emgRes.status === 201 && emgData.escalation.escalation_id, 'TEST T: Emergency Escalation Trigger', `escalation_id=${emgData?.escalation?.escalation_id}`);

  // U: Standardized Health Record API (FHIR Bundle)
  const hrRes = await fetch(`${API_BASE}/patients/PAT-10245/health-record`, {
    headers: { Authorization: `Bearer ${roleTokens.doctor}` }
  });
  const hrData = await hrRes.json();
  assert(hrRes.status === 200 && hrData.healthRecord && hrData.healthRecord.resourceType === 'Bundle', 'TEST U: Standardized Patient Health Record (FHIR Bundle)', `resourceType=${hrData?.healthRecord?.resourceType}`);

  console.log('\n============================================================');
  console.log(` FINAL SCORE: ${passedCount} / ${totalCount} TESTS PASSED`);
  console.log('============================================================');
}

runMasterTests().catch(err => console.error('Master test execution error:', err));

