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

function calculateExpectedAge(dobStr) {
  const birthDate = new Date(dobStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

async function runAgeDobTests() {
  console.log('============================================================');
  console.log(' MAHA HEALTH CONNECT - PATIENT AGE / DOB / GENDER TEST');
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

  // 1. TEST PATIENT C: DOB = 2002-05-15 (Birthday passed this year)
  const dobC = '2002-05-15';
  const expectedAgeC = calculateExpectedAge(dobC); // Expected 24
  const phoneC = `9811${Date.now().toString().slice(-6)}`;

  const regPatC = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'patient',
      name: 'Patient Age Test C',
      phone: phoneC,
      password: 'password123',
      blood_group: 'B+',
      dob: dobC,
      gender: 'Female',
      village: 'Pirangut',
      district: 'Pune'
    })
  });
  assert(regPatC.status === 201, `Register Patient C (status=${regPatC.status})`);
  const tokenC = regPatC.body.token;

  const dashC = await request('/patients/me/dashboard', {
    headers: { Authorization: `Bearer ${tokenC}` }
  });
  assert(dashC.status === 200, `Fetch Patient C Dashboard`);
  assert(dashC.body.patient?.dob === dobC, `Patient C DOB matches registration (${dashC.body.patient?.dob})`);
  assert(dashC.body.patient?.age === expectedAgeC, `Patient C calculated age matches exact DOB (${dashC.body.patient?.age} === ${expectedAgeC})`);
  assert(dashC.body.patient?.gender === 'Female', `Patient C gender is Female (actual=${dashC.body.patient?.gender})`);
  assert(dashC.body.patient?.blood_group === 'B+', `Patient C blood group is B+ (actual=${dashC.body.patient?.blood_group})`);

  // 2. TEST PATIENT D: DOB = 2002-11-20 (Birthday has NOT occurred yet this year)
  const dobD = '2002-11-20';
  const expectedAgeD = calculateExpectedAge(dobD); // Expected 23
  const phoneD = `9711${Date.now().toString().slice(-6)}`;

  const regPatD = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'patient',
      name: 'Patient Age Test D',
      phone: phoneD,
      password: 'password123',
      blood_group: 'AB+',
      dob: dobD,
      gender: 'Male',
      village: 'Paud',
      district: 'Pune'
    })
  });
  assert(regPatD.status === 201, `Register Patient D (status=${regPatD.status})`);
  const tokenD = regPatD.body.token;

  const dashD = await request('/patients/me/dashboard', {
    headers: { Authorization: `Bearer ${tokenD}` }
  });
  assert(dashD.status === 200, `Fetch Patient D Dashboard`);
  assert(dashD.body.patient?.dob === dobD, `Patient D DOB matches registration (${dashD.body.patient?.dob})`);
  assert(dashD.body.patient?.age === expectedAgeD, `Patient D calculated age accurately reflects unreached birthday (${dashD.body.patient?.age} === ${expectedAgeD})`);
  assert(dashD.body.patient?.gender === 'Male', `Patient D gender is Male (actual=${dashD.body.patient?.gender})`);
  assert(dashD.body.patient?.blood_group === 'AB+', `Patient D blood group is AB+ (actual=${dashD.body.patient?.blood_group})`);

  console.log('\n============================================================');
  console.log(` AGE / DOB SCORE: ${passed} / ${total} TESTS PASSED`);
  console.log('============================================================');
}

runAgeDobTests().catch(console.error);
