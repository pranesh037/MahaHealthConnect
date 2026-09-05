const API_BASE = 'http://localhost:4000/api';

async function runTests() {
  console.log('==============================================');
  console.log(' STARTING AUTH & REGISTRATION AUTOMATED TESTS ');
  console.log('==============================================\n');

  // TEST 1: Quick Demo Account Logins
  console.log('--- TEST 1: Demo Account Logins ---');
  const demoAccounts = [
    { role: 'doctor', username: 'USR-DOC-003', password: 'doctor123' },
    { role: 'health_worker', username: 'USR-WRK-001', password: 'worker123' },
    { role: 'facility_admin', username: 'USR-ADM-001', password: 'admin123' },
    { role: 'patient', username: 'USR-PAT-001', password: 'patient123' },
    { role: 'district_authority', username: 'USR-DST-001', password: 'district123' }
  ];

  const tokens = {};

  for (const acc of demoAccounts) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(acc)
    });
    const data = await res.json();
    if (res.status === 200 && data.token && data.user.role === acc.role) {
      console.log(`[PASS] Login as ${acc.role.toUpperCase()}: user_id=${data.user.user_id}, role=${data.user.role}`);
      tokens[acc.role] = data.token;
    } else {
      console.error(`[FAIL] Login as ${acc.role.toUpperCase()} failed:`, res.status, data);
    }
  }

  // TEST 2: /api/me Session Restoration
  console.log('\n--- TEST 2: /api/me Session Restoration ---');
  for (const role of Object.keys(tokens)) {
    const res = await fetch(`${API_BASE}/me`, {
      headers: { Authorization: `Bearer ${tokens[role]}` }
    });
    const data = await res.json();
    if (res.status === 200 && data.user && data.user.role === role) {
      console.log(`[PASS] /api/me restored ${role.toUpperCase()} correctly. Name: ${data.user.name}`);
    } else {
      console.error(`[FAIL] /api/me for ${role.toUpperCase()} failed:`, data);
    }
  }

  // TEST 3: User Registration - New Citizen/Patient
  console.log('\n--- TEST 3: Register New Citizen/Patient ---');
  const testPatient = {
    role: 'patient',
    name: 'Automation Test Patient',
    phone: `99900${Math.floor(10005 + Math.random() * 89999)}`,
    email: `testpatient${Math.floor(1000 + Math.random() * 8999)}@test.com`,
    password: 'password123',
    dob: '1998-04-12',
    gender: 'Female',
    village: 'Paud',
    district: 'Pune',
    blood_group: 'A+'
  };

  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPatient)
  });
  const regData = await regRes.json();
  if (regRes.status === 201 && regData.token && regData.user.role === 'patient') {
    console.log(`[PASS] Registered new Patient: user_id=${regData.user.user_id}, patient_id=${regData.user.patient_id}`);

    // TEST 4: Login with newly registered Patient phone
    console.log('\n--- TEST 4: Login as Newly Registered Patient ---');
    const newLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testPatient.phone,
        password: testPatient.password,
        role: 'patient'
      })
    });
    const newLoginData = await newLoginRes.json();
    if (newLoginRes.status === 200 && newLoginData.user.role === 'patient') {
      console.log(`[PASS] Logged in with mobile number ${testPatient.phone} as PATIENT`);
    } else {
      console.error(`[FAIL] Failed to log in with new patient:`, newLoginData);
    }
  } else {
    console.error(`[FAIL] Patient registration failed:`, regRes.status, regData);
  }

  // TEST 5: User Registration - New Doctor
  console.log('\n--- TEST 5: Register New Doctor ---');
  const testDoctor = {
    role: 'doctor',
    name: 'Dr. Test Specialist',
    phone: `98800${Math.floor(10005 + Math.random() * 89999)}`,
    email: `testdoc${Math.floor(1000 + Math.random() * 8999)}@hospital.gov.in`,
    password: 'docpassword123',
    specialty: 'Cardiology',
    facility_name: 'District Hospital Aundh'
  };

  const docRegRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testDoctor)
  });
  const docRegData = await docRegRes.json();
  if (docRegRes.status === 201 && docRegData.token && docRegData.user.role === 'doctor') {
    console.log(`[PASS] Registered new Doctor: user_id=${docRegData.user.user_id}, specialty=${docRegData.user.specialty}`);
  } else {
    console.error(`[FAIL] Doctor registration failed:`, docRegRes.status, docRegData);
  }

  // TEST 6: Duplicate Registration Rejection
  console.log('\n--- TEST 6: Duplicate Phone Registration Rejection ---');
  const dupRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPatient)
  });
  const dupData = await dupRes.json();
  if (dupRes.status === 400 && dupData.error) {
    console.log(`[PASS] Duplicate registration rejected correctly: "${dupData.error}"`);
  } else {
    console.error(`[FAIL] Duplicate registration was not rejected:`, dupData);
  }

  // TEST 7: Invalid Credentials
  console.log('\n--- TEST 7: Invalid Password Rejection ---');
  const wrongRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-DOC-003', password: 'wrongpassword', role: 'doctor' })
  });
  const wrongData = await wrongRes.json();
  if (wrongRes.status === 401 && wrongData.error) {
    console.log(`[PASS] Invalid login rejected correctly: "${wrongData.error}"`);
  } else {
    console.error(`[FAIL] Invalid login was not rejected:`, wrongData);
  }

  console.log('\n==============================================');
  console.log(' ALL AUTHENTICATION TESTS COMPLETED ');
  console.log('==============================================');
}

runTests().catch(err => console.error('Test execution error:', err));
