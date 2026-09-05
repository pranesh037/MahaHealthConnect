const BASE_URL = 'http://localhost:4000/api';

async function runFullQAPass() {
  console.log('==================================================');
  console.log('MAHA HEALTH CONNECT – COMPREHENSIVE QA PASS');
  console.log('==================================================\n');

  const timestamp = Date.now();
  const testResults = [];

  const recordResult = (section, testName, passed, details = '') => {
    testResults.push({ section, testName, passed, details });
    const statusSymbol = passed ? '✓ VERIFIED' : '✗ FAILED';
    console.log(`[${section}] ${testName}: ${statusSymbol}${details ? ` - ${details}` : ''}`);
  };

  // ----------------------------------------------------
  // SECTION 1: AUTHENTICATION & RBAC (ALL 5 ROLES)
  // ----------------------------------------------------
  console.log('--- 1. Testing Authentication & RBAC ---');
  const roles = ['patient', 'health_worker', 'doctor', 'facility_admin', 'district_authority'];
  const userTokens = {};

  for (const role of roles) {
    const username = `qa_${role}_${timestamp}`;
    const email = `${username}@mahamoh.gov.in`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        name: `QA User ${role.toUpperCase()}`,
        phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
        email,
        password: 'Password@123',
        facility_id: 'FAC-101'
      })
    });
    const regData = await regRes.json();
    if (regRes.ok && regData.token && regData.user.role === role) {
      userTokens[role] = regData.token;
      recordResult('Authentication', `Register & Login (${role})`, true, `User ID: ${regData.user.user_id}`);
    } else {
      recordResult('Authentication', `Register & Login (${role})`, false, JSON.stringify(regData));
    }
  }

  // Verify Session Restoration (GET /api/me)
  for (const role of roles) {
    const meRes = await fetch(`${BASE_URL}/me`, {
      headers: { 'Authorization': `Bearer ${userTokens[role]}` }
    });
    const meData = await meRes.json();
    if (meRes.ok && meData.user && meData.user.role === role) {
      recordResult('Authentication', `Session Restoration (${role})`, true, `Returned role: ${meData.user.role}`);
    } else {
      recordResult('Authentication', `Session Restoration (${role})`, false);
    }
  }

  // ----------------------------------------------------
  // SECTION 2: HEALTH WORKER WORKFLOWS
  // ----------------------------------------------------
  console.log('\n--- 2. Testing Health Worker Workflows ---');
  const hwToken = userTokens['health_worker'];

  // Patient Registration
  const testPatientPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  const regPatientRes = await fetch(`${BASE_URL}/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hwToken}`
    },
    body: JSON.stringify({
      name: 'Test QA Patient',
      age: 42,
      gender: 'Female',
      phone: testPatientPhone,
      village: 'Mulshi Gaon',
      district: 'Pune',
      registered_facility_id: 'FAC-101'
    })
  });
  const regPatientData = await regPatientRes.json();
  const createdPatientId = regPatientData.patient?.patient_id || 'PAT-10245';
  recordResult('Health Worker', 'Patient Registration', regPatientRes.ok, `Created Patient ID: ${createdPatientId}`);

  // Patient Search
  const searchRes = await fetch(`${BASE_URL}/patients?q=Mulshi`, {
    headers: { 'Authorization': `Bearer ${hwToken}` }
  });
  const searchData = await searchRes.json();
  recordResult('Health Worker', 'Patient Search via API', searchRes.ok && Array.isArray(searchData.patients), `Found ${searchData.patients?.length || 0} patients`);

  // Digital Triage
  const triageRes = await fetch(`${BASE_URL}/triage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hwToken}`
    },
    body: JSON.stringify({
      patient_id: createdPatientId,
      priority: 'URGENT',
      vitals: { bp: '140/90', pulse: 88, temp: 99.1, spo2: 97 },
      reason: 'Chest tightness and shortness of breath'
    })
  });
  const triageData = await triageRes.json();
  recordResult('Health Worker', 'Digital Triage Save', triageRes.ok, `Triage ID: ${triageData.triage?.triage_id || 'OK'}`);

  // Secure Access Grant Creation
  const docUserId = `USR-DOC-QA-${timestamp}`;
  // First register doctor specifically for grant test
  const grantDocRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'doctor',
      name: 'Dr. QA Specialist',
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `qa_grant_doc_${timestamp}@mahamoh.gov.in`,
      password: 'Password@123',
      facility_id: 'FAC-103',
      specialty: 'Cardiology'
    })
  });
  const grantDocData = await grantDocRes.json();
  const grantDocToken = grantDocData.token;
  const grantDocId = grantDocData.user.user_id;

  const grantRes = await fetch(`${BASE_URL}/access-grants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hwToken}`
    },
    body: JSON.stringify({
      patient_id: createdPatientId,
      doctor_id: grantDocId,
      duration_minutes: 60,
      reason: 'Specialist Cardiology Evaluation'
    })
  });
  const grantData = await grantRes.json();
  const createdGrantId = grantData.grant?.grant_id;
  recordResult('Secure Access', 'AccessGrant Creation', grantRes.ok && Boolean(createdGrantId), `Grant ID: ${createdGrantId}`);

  // ----------------------------------------------------
  // SECTION 3: DOCTOR WORKFLOWS & CLINICAL AUTHORIZATION
  // ----------------------------------------------------
  console.log('\n--- 3. Testing Doctor Workflows & Authorized Clinical Access ---');
  
  // Authorized Patients List
  const docPatientsRes = await fetch(`${BASE_URL}/patients`, {
    headers: { 'Authorization': `Bearer ${grantDocToken}` }
  });
  const docPatientsData = await docPatientsRes.json();
  const isAuthorizedInList = (docPatientsData.patients || []).some(p => p.patient_id === createdPatientId);
  recordResult('Doctor', 'Authorized Patients List', docPatientsRes.ok && isAuthorizedInList, `Patient ${createdPatientId} present in list`);

  // Fetch Clinical Record
  const clinicalRes = await fetch(`${BASE_URL}/patients/${createdPatientId}?dataType=CLINICAL_FULL`, {
    headers: { 'Authorization': `Bearer ${grantDocToken}` }
  });
  const clinicalData = await clinicalRes.json();
  recordResult('Doctor', 'View Clinical Record (Authorized)', clinicalRes.ok && clinicalData.patient?.patient_id === createdPatientId, `Retrieved clinical data for ${clinicalData.patient?.name}`);

  // Security Check: Access Patient Without Grant
  const unauthRes = await fetch(`${BASE_URL}/patients/PAT-10246?dataType=CLINICAL_FULL`, {
    headers: { 'Authorization': `Bearer ${grantDocToken}` }
  });
  recordResult('Doctor Security', 'Unauthorized Access Enforcement', unauthRes.status === 403, 'Denied 403 Forbidden as expected');

  // Doctor Consultation & Prescription
  const consultRes = await fetch(`${BASE_URL}/consultations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${grantDocToken}`
    },
    body: JSON.stringify({
      patient_id: createdPatientId,
      complaint: 'Chest pain on exertion',
      observations: 'Elevated BP 140/90',
      diagnosis: 'Hypertension Stage 1',
      notes: 'Advised low salt diet, ECG ordered'
    })
  });
  recordResult('Doctor', 'Save Consultation Record', consultRes.ok);

  const rxRes = await fetch(`${BASE_URL}/prescriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${grantDocToken}`
    },
    body: JSON.stringify({
      patient_id: createdPatientId,
      diagnosis: 'Hypertension',
      items: [{ medicine_name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days' }]
    })
  });
  recordResult('Doctor', 'Save Prescription', rxRes.ok);

  const diagOrderRes = await fetch(`${BASE_URL}/diagnostics/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${grantDocToken}`
    },
    body: JSON.stringify({
      patient_id: createdPatientId,
      test_name: '12-Lead ECG'
    })
  });
  recordResult('Doctor', 'Create Diagnostic Order', diagOrderRes.ok);

  const followupRes = await fetch(`${BASE_URL}/followups`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${grantDocToken}`
    },
    body: JSON.stringify({
      patient_id: createdPatientId,
      followup_date: '2026-09-20',
      reason: 'Review BP and ECG report'
    })
  });
  recordResult('Doctor', 'Schedule Follow-up', followupRes.ok);

  // ----------------------------------------------------
  // SECTION 4: SMART FACILITY MATCHING & REFERRALS
  // ----------------------------------------------------
  console.log('\n--- 4. Testing Smart Facility Matching & Multi-Hospital Referrals ---');
  const matchRes = await fetch(`${BASE_URL}/facilities/match`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hwToken}`
    },
    body: JSON.stringify({
      specialty: 'Cardiology',
      diagnostic: 'ECG',
      emergency: true,
      bedRequired: true
    })
  });
  const matchData = await matchRes.json();
  const hasMatches = matchRes.ok && Array.isArray(matchData.matches) && matchData.matches.length > 0;
  recordResult('Matching', 'Smart Facility Matching Engine', hasMatches, `Found ${matchData.matches?.length || 0} ranked hospitals`);

  // Create Multi-Hospital Referral
  const referralRes = await fetch(`${BASE_URL}/referrals`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hwToken}`
    },
    body: JSON.stringify({
      patient_id: createdPatientId,
      specialty_required: 'Cardiology',
      priority: 'HIGH',
      clinical_notes: 'Urgent cardiology evaluation required'
    })
  });
  const referralData = await referralRes.json();
  const createdReferralId = referralData.referral?.referral_id;
  recordResult('Referral', 'Create Referral', referralRes.ok && Boolean(createdReferralId), `Referral ID: ${createdReferralId}`);

  // ----------------------------------------------------
  // SECTION 5: FACILITY ADMIN & DISTRICT AUTHORITY
  // ----------------------------------------------------
  console.log('\n--- 5. Testing Facility Admin & District Authority Workflows ---');
  const adminToken = userTokens['facility_admin'];
  const districtToken = userTokens['district_authority'];

  // Facility Admin Decision on Referral
  if (createdReferralId) {
    const decideRes = await fetch(`${BASE_URL}/referrals/${createdReferralId}/decision`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'ACCEPTED',
        hospital_id: 'FAC-103'
      })
    });
    recordResult('Facility Admin', 'Accept Referral Decision', decideRes.ok);
  }

  // Facility Resource Updates
  const updateRes = await fetch(`${BASE_URL}/facilities/FAC-101/resources`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      active_beds: 15,
      status: 'AVAILABLE',
      specialties: ['General Medicine', 'Cardiology', 'ECG']
    })
  });
  recordResult('Facility Admin', 'Update Facility Resources', updateRes.ok);

  // District Overview & Audit Logs
  const auditRes = await fetch(`${BASE_URL}/audit`, {
    headers: { 'Authorization': `Bearer ${districtToken}` }
  });
  const auditData = await auditRes.json();
  recordResult('District Authority', 'Fetch Security Audit Logs', auditRes.ok && Array.isArray(auditData.logs), `Logs retrieved: ${auditData.logs?.length || 0}`);

  // ----------------------------------------------------
  // SECTION 6: OFFLINE SYNC
  // ----------------------------------------------------
  console.log('\n--- 6. Testing Offline Sync API ---');
  const syncRes = await fetch(`${BASE_URL}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hwToken}`
    },
    body: JSON.stringify({
      items: [
        { type: 'Triage', patient_id: createdPatientId, priority: 'ROUTINE', vitals: { bp: '120/80' } }
      ]
    })
  });
  recordResult('Offline Sync', 'Sync Queued Items API (/api/sync)', syncRes.ok);

  console.log('\n==================================================');
  console.log('SUMMARY OF QA RESULTS:');
  const passedCount = testResults.filter(r => r.passed).length;
  console.log(`TOTAL PASSED: ${passedCount} / ${testResults.length}`);
  console.log('==================================================\n');
}

runFullQAPass().catch(err => {
  console.error('QA Pass Failed:', err);
  process.exit(1);
});
