const BASE_URL = 'http://localhost:4000/api';

async function runIsolationAuditTest() {
  console.log('==================================================');
  console.log('AUTOMATED USER-DATA ISOLATION AUDIT & TEST');
  console.log('==================================================\n');

  const timestamp = Date.now();

  // 1. Setup Accounts
  console.log('1. Creating test accounts for isolation verification...');
  
  // Health Worker
  const hwRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'health_worker',
      name: 'Isolation HW',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `hw_iso_${timestamp}@mahamoh.gov.in`,
      password: 'Password@123',
      facility_id: 'FAC-101'
    })
  });
  const hwData = await hwRes.json();
  const hwToken = hwData.token;

  // Doctor A
  const docARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'doctor',
      name: 'Dr. Alpha (Doctor A)',
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `doc_a_${timestamp}@mahamoh.gov.in`,
      password: 'Password@123',
      facility_id: 'FAC-103',
      specialty: 'Cardiology'
    })
  });
  const docAData = await docARes.json();
  const docAToken = docAData.token;
  const docAId = docAData.user.user_id;

  // Doctor B
  const docBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'doctor',
      name: 'Dr. Beta (Doctor B)',
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `doc_b_${timestamp}@mahamoh.gov.in`,
      password: 'Password@123',
      facility_id: 'FAC-104',
      specialty: 'Neurology'
    })
  });
  const docBData = await docBRes.json();
  const docBToken = docBData.token;
  const docBId = docBData.user.user_id;

  // Patient A
  const patARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'patient',
      name: 'Patient Alpha',
      phone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `pat_a_${timestamp}@mahamoh.gov.in`,
      password: 'Password@123',
      facility_id: 'FAC-101'
    })
  });
  const patAData = await patARes.json();
  const patAToken = patAData.token;
  const patAId = patAData.user.patient_id;

  // Patient B
  const patBRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'patient',
      name: 'Patient Beta',
      phone: `97${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `pat_b_${timestamp}@mahamoh.gov.in`,
      password: 'Password@123',
      facility_id: 'FAC-102'
    })
  });
  const patBData = await patBRes.json();
  const patBToken = patBData.token;
  const patBId = patBData.user.patient_id;

  // Facility Admin A (FAC-101)
  const adminARes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'facility_admin',
      name: 'Admin Facility 101',
      phone: `96${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: `admin_a_${timestamp}@mahamoh.gov.in`,
      password: 'Password@123',
      facility_id: 'FAC-101'
    })
  });
  const adminAToken = (await adminARes.json()).token;

  console.log('✓ Accounts created successfully.\n');

  // ----------------------------------------------------
  // TEST A: DOCTOR ISOLATION (DOCTOR A vs DOCTOR B)
  // ----------------------------------------------------
  console.log('--- TEST A: DOCTOR ISOLATION (DOCTOR A vs DOCTOR B) ---');
  
  // HW creates grant specifically for Doctor A to access Patient A
  const grantRes = await fetch(`${BASE_URL}/access-grants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hwToken}`
    },
    body: JSON.stringify({
      patient_id: patAId,
      doctor_id: docAId,
      duration_minutes: 30,
      reason: 'Doctor A Isolation Evaluation'
    })
  });
  const grantData = await grantRes.json();
  const grantId = grantData.grant?.grant_id;
  console.log('✓ HW created grant for Doctor A to access Patient A:', grantId);

  // Doctor A checks access grants
  const docAGrantsRes = await fetch(`${BASE_URL}/access-grants`, {
    headers: { 'Authorization': `Bearer ${docAToken}` }
  });
  const docAGrants = (await docAGrantsRes.json()).grants || [];
  const docAHasGrant = docAGrants.some(g => g.grant_id === grantId);

  // Doctor B checks access grants
  const docBGrantsRes = await fetch(`${BASE_URL}/access-grants`, {
    headers: { 'Authorization': `Bearer ${docBToken}` }
  });
  const docBGrants = (await docBGrantsRes.json()).grants || [];
  const docBHasGrant = docBGrants.some(g => g.grant_id === grantId);

  console.log('  Doctor A sees grant:', docAHasGrant ? 'YES (Expected)' : 'NO');
  console.log('  Doctor B sees grant:', docBHasGrant ? 'YES' : 'NO (Expected)');
  
  if (!docAHasGrant || docBHasGrant) {
    throw new Error('Doctor Access Grant Isolation Failed!');
  }
  console.log('✓ Doctor Access Grant Isolation: PASS');

  // Doctor A clinical access to Patient A
  const docAClinicalRes = await fetch(`${BASE_URL}/patients/${patAId}?dataType=CLINICAL_FULL`, {
    headers: { 'Authorization': `Bearer ${docAToken}` }
  });
  console.log('  Doctor A clinical access to Patient A:', docAClinicalRes.status === 200 ? 'ALLOWED (Expected)' : 'DENIED');

  // Doctor B clinical access to Patient A
  const docBClinicalRes = await fetch(`${BASE_URL}/patients/${patAId}?dataType=CLINICAL_FULL`, {
    headers: { 'Authorization': `Bearer ${docBToken}` }
  });
  console.log('  Doctor B clinical access to Patient A:', docBClinicalRes.status === 403 ? 'DENIED 403 (Expected)' : 'ALLOWED');

  if (docAClinicalRes.status !== 200 || docBClinicalRes.status !== 403) {
    throw new Error('Doctor Clinical Access Isolation Failed!');
  }
  console.log('✓ Doctor Clinical Access Isolation: PASS\n');

  // ----------------------------------------------------
  // TEST B: DOCTOR APPOINTMENTS & PRESCRIPTIONS ISOLATION
  // ----------------------------------------------------
  console.log('--- TEST B: DOCTOR APPOINTMENTS & PRESCRIPTIONS ISOLATION ---');

  // Doctor A creates prescription
  await fetch(`${BASE_URL}/prescriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${docAToken}`
    },
    body: JSON.stringify({
      patient_id: patAId,
      diagnosis: 'Hypertension',
      items: [{ medicine_name: 'Amlodipine' }]
    })
  });

  // Doctor A fetches prescriptions
  const docAPx = (await (await fetch(`${BASE_URL}/prescriptions`, { headers: { 'Authorization': `Bearer ${docAToken}` } })).json()).prescriptions || [];
  // Doctor B fetches prescriptions
  const docBPx = (await (await fetch(`${BASE_URL}/prescriptions`, { headers: { 'Authorization': `Bearer ${docBToken}` } })).json()).prescriptions || [];

  console.log('  Doctor A prescriptions count:', docAPx.length);
  console.log('  Doctor B prescriptions count:', docBPx.length);

  if (docAPx.length === 0 || docBPx.some(p => p.patient_id === patAId)) {
    throw new Error('Doctor Prescription Data Isolation Failed!');
  }
  console.log('✓ Doctor Prescription Data Isolation: PASS\n');

  // ----------------------------------------------------
  // TEST C: PATIENT PRIVACY ISOLATION (PATIENT A vs PATIENT B)
  // ----------------------------------------------------
  console.log('--- TEST C: PATIENT PRIVACY ISOLATION ---');

  // Patient A requests Patient B's clinical record directly
  const patAUnauthRes = await fetch(`${BASE_URL}/patients/${patBId}?dataType=CLINICAL_FULL`, {
    headers: { 'Authorization': `Bearer ${patAToken}` }
  });
  console.log('  Patient A accessing Patient B clinical record:', patAUnauthRes.status === 403 ? 'DENIED 403 (Expected)' : 'ALLOWED');

  if (patAUnauthRes.status !== 403) {
    throw new Error('Patient Clinical Record Privacy Isolation Failed!');
  }
  console.log('✓ Patient Clinical Record Privacy Isolation: PASS\n');

  // ----------------------------------------------------
  // TEST D: FACILITY ADMIN SCOPE ISOLATION
  // ----------------------------------------------------
  console.log('--- TEST D: FACILITY ADMIN SCOPE ISOLATION ---');

  // Admin A (FAC-101) tries to update FAC-102 resources
  const adminAUnauthRes = await fetch(`${BASE_URL}/facilities/FAC-102/resources`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminAToken}`
    },
    body: JSON.stringify({ active_beds: 99 })
  });
  console.log('  Admin A updating FAC-102 resources:', adminAUnauthRes.status === 403 ? 'DENIED 403 (Expected)' : 'ALLOWED');

  // Admin A updates FAC-101 resources
  const adminAAuthRes = await fetch(`${BASE_URL}/facilities/FAC-101/resources`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminAToken}`
    },
    body: JSON.stringify({ active_beds: 20 })
  });
  console.log('  Admin A updating FAC-101 resources:', adminAAuthRes.status === 200 ? 'ALLOWED 200 (Expected)' : 'DENIED');

  if (adminAUnauthRes.status !== 403 || adminAAuthRes.status !== 200) {
    throw new Error('Facility Admin Scope Isolation Failed!');
  }
  console.log('✓ Facility Admin Scope Isolation: PASS\n');

  console.log('==================================================');
  console.log('ALL USER-DATA ISOLATION TESTS PASSED PERFECTLY!');
  console.log('==================================================\n');
}

runIsolationAuditTest().catch(err => {
  console.error('Isolation Test Failed:', err);
  process.exit(1);
});
