const API_BASE = 'http://localhost:4000/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, body: data };
}

async function runPhase2Tests() {
  console.log('============================================================');
  console.log(' MAHA HEALTH CONNECT - PHASE 2 PATIENT DASHBOARD TEST');
  console.log('============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
    }
  }

  const phoneA = `9888${Date.now().toString().slice(-6)}`;
  const phoneB = `9777${Date.now().toString().slice(-6)}`;

  // 1. STEP A: Register Patient A with Blood Group B+
  const regPatA = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'patient',
      name: 'Patient Integration Test Alpha',
      phone: phoneA,
      password: 'password123',
      blood_group: 'B+',
      dob: '1995-04-12',
      village: 'Mulshi',
      district: 'Pune'
    })
  });
  assert(regPatA.status === 201, `Register Patient A (status=${regPatA.status})`);
  const patAToken = regPatA.body.token;
  const patAPatientId = regPatA.body.user.patient_id;
  const patAUserId = regPatA.body.user.user_id;

  // 2. STEP B: Patient A Dashboard Verification (Blood Group B+)
  const patADash = await request('/patients/me/dashboard', {
    headers: { Authorization: `Bearer ${patAToken}` }
  });
  assert(patADash.status === 200, `Fetch Patient A Dashboard (status=${patADash.status})`);
  assert(patADash.body.patient?.blood_group === 'B+', `Patient A Blood Group is B+ (actual=${patADash.body.patient?.blood_group})`);
  assert(patADash.body.patient?.name === 'Patient Integration Test Alpha', `Patient A Name matches registration`);

  // Register HW Tester
  const regHW = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'health_worker',
      name: 'HW Phase 2 Tester',
      phone: `9688${Date.now().toString().slice(-6)}`,
      password: 'password123',
      facility_id: 'FAC-101',
      facility_name: 'PHC Mulshi'
    })
  });
  assert(regHW.status === 201, `Register HW Tester`);
  const hwToken = regHW.body.token;

  // Register Doctor A
  const regDoc = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'doctor',
      name: 'Dr. Deshmukh Specialist',
      phone: `9588${Date.now().toString().slice(-6)}`,
      password: 'password123',
      facility_id: 'FAC-103',
      facility_name: 'District Hospital Aundh',
      specialty: 'Cardiology'
    })
  });
  assert(regDoc.status === 201, `Register Doctor A`);
  const docToken = regDoc.body.token;
  const docUserId = regDoc.body.user.user_id;

  // 3. STEP C: Create Appointment for Patient A
  const createApt = await request('/appointments', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hwToken}` },
    body: JSON.stringify({
      patient_id: patAPatientId,
      doctor_id: docUserId,
      doctor_name: 'Dr. Deshmukh Specialist',
      facility_id: 'FAC-103',
      facility_name: 'District Hospital Aundh',
      date: '2026-09-15',
      time: '11:00 AM',
      type: 'OPD Checkup',
      status: 'CONFIRMED'
    })
  });
  assert(createApt.status === 201, `Create Appointment for Patient A`);

  // Verify Patient A Dashboard Upcoming Appointment
  const patADashApt = await request('/patients/me/dashboard', {
    headers: { Authorization: `Bearer ${patAToken}` }
  });
  assert(patADashApt.body.appointments?.length >= 1, `Patient A dashboard shows upcoming appointment (count=${patADashApt.body.appointments?.length})`);

  // 4. STEP D: Create Referral for Patient A
  const createRef = await request('/referrals', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hwToken}` },
    body: JSON.stringify({
      patient_id: patAPatientId,
      referring_facility_id: 'FAC-101',
      referring_facility_name: 'PHC Mulshi',
      specialty_required: 'Cardiology',
      priority: 'HIGH',
      clinical_notes: 'Severe chest pain evaluation',
      target_hospitals: [{ facility_id: 'FAC-103', facility: 'District Hospital Aundh' }]
    })
  });
  assert(createRef.status === 201, `Create Referral for Patient A`);
  const referralId = createRef.body.referral?.referral_id;

  // Verify Patient A Dashboard Active Referral (Status PENDING/SENT)
  const patADashRef1 = await request('/patients/me/dashboard', {
    headers: { Authorization: `Bearer ${patAToken}` }
  });
  assert(patADashRef1.body.referrals?.length >= 1, `Patient A dashboard shows active referral`);

  // 5. STEP E: Destination Doctor Accepts Referral -> Status propagation
  const acceptRef = await request(`/referrals/${referralId}/decision`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${docToken}` },
    body: JSON.stringify({
      decision: 'ACCEPTED',
      facility_id: 'FAC-103',
      facility_name: 'District Hospital Aundh',
      doctor_id: docUserId,
      doctor_name: 'Dr. Deshmukh Specialist',
      notes: 'Bed reserved in Cardiology Ward'
    })
  });
  assert(acceptRef.status === 200, `Doctor Accepts Referral`);

  // Verify Referral Status Propagation on Patient A Dashboard
  const patADashRef2 = await request('/patients/me/dashboard', {
    headers: { Authorization: `Bearer ${patAToken}` }
  });
  assert(patADashRef2.body.referrals?.[0]?.status === 'ACCEPTED', `Referral status propagated to ACCEPTED on Patient A dashboard`);

  // 6. STEP F: Doctor Creates Consultation for Patient A
  const createConsult = await request('/consultations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${docToken}` },
    body: JSON.stringify({
      patient_id: patAPatientId,
      doctor_id: docUserId,
      doctor_name: 'Dr. Deshmukh Specialist',
      facility_id: 'FAC-103',
      facility_name: 'District Hospital Aundh',
      complaint: 'Chest discomfort & palpitation',
      diagnosis: 'Mild Angina',
      notes: 'Rest & Beta blockers recommended'
    })
  });
  assert(createConsult.status === 201, `Doctor Creates Consultation for Patient A`);

  // 7. STEP G: Doctor Creates Prescription for Patient A
  const createRx = await request('/prescriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${docToken}` },
    body: JSON.stringify({
      patient_id: patAPatientId,
      doctor_id: docUserId,
      doctor_name: 'Dr. Deshmukh Specialist',
      items: [
        { medicine_name: 'Amlodipine', dosage: '5 mg', frequency: 'Once Daily', duration: '30 Days', instructions: 'Take after food' }
      ]
    })
  });
  assert(createRx.status === 201, `Doctor Creates Prescription for Patient A`);

  // 8. STEP H: Diagnostic Order & Result Completion for Patient A
  const createDiag = await request('/diagnostics/orders', {
    method: 'POST',
    headers: { Authorization: `Bearer ${docToken}` },
    body: JSON.stringify({
      patient_id: patAPatientId,
      facility_id: 'FAC-103',
      test_name: 'ECG 12-Lead',
      notes: 'Check ST segment elevation'
    })
  });
  assert(createDiag.status === 201, `Doctor Creates Diagnostic Order`);
  const orderId = createDiag.body.order?.order_id;

  const updateDiag = await request(`/diagnostics/orders/${orderId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${docToken}` },
    body: JSON.stringify({
      status: 'COMPLETED',
      result: 'Normal sinus rhythm'
    })
  });
  assert(updateDiag.status === 200, `Diagnostic Report Completed`);

  // 9. STEP I: Health Worker Creates Follow-up for Patient A
  const createFup = await request('/followups', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hwToken}` },
    body: JSON.stringify({
      patient_id: patAPatientId,
      followup_date: '2026-09-30',
      reason: 'Cardiac OPD Followup Check',
      type: 'Specialist Followup'
    })
  });
  assert(createFup.status === 201, `HW Creates Follow-up for Patient A`);

  // Verify Patient A Dashboard Longitudinal Records & Encounters
  const patADashFinal = await request('/patients/me/dashboard', {
    headers: { Authorization: `Bearer ${patAToken}` }
  });
  assert(patADashFinal.body.prescriptions?.length >= 1, `Patient A dashboard shows prescription history`);
  assert(patADashFinal.body.diagnostics?.length >= 1, `Patient A dashboard shows completed diagnostic result`);
  assert(patADashFinal.body.followups?.length >= 1, `Patient A dashboard shows follow-up schedule`);
  assert(patADashFinal.body.encounters?.length >= 1, `Patient A dashboard shows recent healthcare encounters`);
  assert(patADashFinal.body.notifications?.length >= 1, `Patient A dashboard inbox receives targeted follow-up notification`);

  // 10. STEP J: Register Patient B (Blood Group O+) & Verify Strict User Isolation
  const regPatB = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'patient',
      name: 'Patient Integration Test Beta',
      phone: phoneB,
      password: 'password123',
      blood_group: 'O+',
      dob: '1998-08-20',
      village: 'Haveli',
      district: 'Pune'
    })
  });
  assert(regPatB.status === 201, `Register Patient B with Blood Group O+`);
  const patBToken = regPatB.body.token;

  const patBDash = await request('/patients/me/dashboard', {
    headers: { Authorization: `Bearer ${patBToken}` }
  });
  assert(patBDash.status === 200, `Fetch Patient B Dashboard`);
  assert(patBDash.body.patient?.blood_group === 'O+', `Patient B Blood Group is O+ (actual=${patBDash.body.patient?.blood_group})`);
  assert(patBDash.body.appointments?.length === 0, `Patient B receives ZERO Patient A appointments (isolated=true)`);
  assert(patBDash.body.referrals?.length === 0, `Patient B receives ZERO Patient A referrals (isolated=true)`);
  assert(patBDash.body.prescriptions?.length === 0, `Patient B receives ZERO Patient A prescriptions (isolated=true)`);
  assert(patBDash.body.diagnostics?.length === 0, `Patient B receives ZERO Patient A diagnostics (isolated=true)`);
  assert(patBDash.body.followups?.length === 0, `Patient B receives ZERO Patient A followups (isolated=true)`);
  assert(patBDash.body.encounters?.length === 0, `Patient B receives ZERO Patient A encounters (isolated=true)`);

  // 11. STEP K: Non-Maternal Patient Verification
  assert(patADashFinal.body.maternal === null, `Patient A non-maternal profile returns null maternal data`);
  assert(patBDash.body.maternal === null, `Patient B non-maternal profile returns null maternal data`);

  console.log('\n============================================================');
  console.log(` PHASE 2 SCORE: ${passed} / ${total} TESTS PASSED`);
  console.log('============================================================');
}

runPhase2Tests().catch(console.error);
