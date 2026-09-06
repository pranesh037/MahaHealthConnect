const API_BASE = 'http://localhost:4000/api';

async function testAttendanceOwnership() {
  console.log('--- STARTING ATTENDANCE OWNERSHIP VERIFICATION TEST ---');

  // 1. Login Doctor
  const docLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-DOC-001', password: 'doctor123' })
  });
  const docLoginData = await docLoginRes.json();
  if (!docLoginRes.ok || !docLoginData.token) {
    throw new Error(`Doctor login failed: ${JSON.stringify(docLoginData)}`);
  }
  const doctorToken = docLoginData.token;
  const doctorId = docLoginData.user.user_id;
  const doctorFacility = docLoginData.user.facility_id;
  console.log(`✓ Doctor Logged In: ${doctorId} (Facility: ${doctorFacility})`);

  // 2. Doctor Check In
  const docCheckInRes = await fetch(`${API_BASE}/attendance/check-in`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${doctorToken}`,
      'Content-Type': 'application/json'
    },
    // Send body with malicious user_id to test enforcement of req.user.user_id
    body: JSON.stringify({ user_id: 'ATTEMPTED-SPOOF-ID' })
  });
  const docCheckInData = await docCheckInRes.json();
  console.log(`Doctor Check-In Response Status: ${docCheckInRes.status}`);
  if (docCheckInRes.status !== 201 && docCheckInRes.status !== 400) {
    throw new Error(`Unexpected Doctor Check-In status: ${docCheckInRes.status} ${JSON.stringify(docCheckInData)}`);
  }

  const docAtt = docCheckInData.attendance;
  if (docAtt) {
    console.log(`✓ Doctor Attendance Record User ID: ${docAtt.user_id} (Expected: ${doctorId})`);
    if (docAtt.user_id === 'ATTEMPTED-SPOOF-ID') {
      throw new Error('SECURITY BUG: Body user_id spoofing succeeded!');
    }
    if (docAtt.user_id !== doctorId) {
      throw new Error(`User ID mismatch: got ${docAtt.user_id}, expected ${doctorId}`);
    }
  }

  // 3. Doctor Check Out
  const docCheckOutRes = await fetch(`${API_BASE}/attendance/check-out`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${doctorToken}`,
      'Content-Type': 'application/json'
    }
  });
  const docCheckOutData = await docCheckOutRes.json();
  console.log(`✓ Doctor Check-Out Response Status: ${docCheckOutRes.status}`);
  if (docCheckOutRes.ok && docCheckOutData.attendance) {
    console.log(`✓ Doctor Attendance Status Updated: ${docCheckOutData.attendance.status}`);
  }

  // 4. Login Health Worker
  const wrkLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-WRK-001', password: 'worker123' })
  });
  const wrkLoginData = await wrkLoginRes.json();
  if (!wrkLoginRes.ok || !wrkLoginData.token) {
    throw new Error(`Worker login failed: ${JSON.stringify(wrkLoginData)}`);
  }
  const workerToken = wrkLoginData.token;
  const workerId = wrkLoginData.user.user_id;
  const workerFacility = wrkLoginData.user.facility_id;
  console.log(`✓ Health Worker Logged In: ${workerId} (Facility: ${workerFacility})`);

  // 5. Health Worker Check In
  const wrkCheckInRes = await fetch(`${API_BASE}/attendance/check-in`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${workerToken}`,
      'Content-Type': 'application/json'
    }
  });
  const wrkCheckInData = await wrkCheckInRes.json();
  console.log(`Worker Check-In Response Status: ${wrkCheckInRes.status}`);
  if (wrkCheckInRes.status === 201) {
    console.log(`✓ Worker Attendance Created: ${wrkCheckInData.attendance.attendance_id} for user ${wrkCheckInData.attendance.user_id}`);
  } else {
    console.log(`Worker Check-In result: ${wrkCheckInData.error || 'Already checked in'}`);
  }

  // 6. Login Facility Admin for FAC-101
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-ADM-001', password: 'admin123' })
  });
  const adminLoginData = await adminLoginRes.json();
  if (!adminLoginRes.ok || !adminLoginData.token) {
    throw new Error(`Admin login failed: ${JSON.stringify(adminLoginData)}`);
  }
  const adminToken = adminLoginData.token;
  const adminFacility = adminLoginData.user.facility_id;
  console.log(`✓ Facility Admin Logged In: ${adminLoginData.user.user_id} (Facility: ${adminFacility})`);

  // 7. Facility Admin View Roster
  const adminAttRes = await fetch(`${API_BASE}/attendance`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const adminAttData = await adminAttRes.json();
  console.log(`✓ Facility Admin Attendance Query Status: ${adminAttRes.status}`);
  const attList = adminAttData.attendance || [];
  console.log(`✓ Facility Admin retrieved ${attList.length} attendance records for facility ${adminFacility}`);

  const hasDoctorRecord = attList.some((a) => a.user_id === doctorId);
  const hasWorkerRecord = attList.some((a) => a.user_id === workerId);
  console.log(`✓ Doctor Record Present in Admin Roster: ${hasDoctorRecord}`);
  console.log(`✓ Health Worker Record Present in Admin Roster: ${hasWorkerRecord}`);

  if (!hasDoctorRecord || !hasWorkerRecord) {
    console.warn('Warning: Roster check failed to find doctor or worker record. Roster records:', attList.map(a => `${a.user_id}:${a.facility_id}`));
    throw new Error('Roster record missing!');
  } else {
    console.log('✓ SUCCESS: All staff self-service attendance records correctly visible in Facility Admin Roster!');
  }

  console.log('--- ALL TEST ASSERTIONS PASSED ---');
}

testAttendanceOwnership().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
