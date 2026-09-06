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

async function runPhase1Tests() {
  console.log('============================================================');
  console.log(' MAHA HEALTH CONNECT - PHASE 1 COMPLIANCE & ISOLATION TEST');
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

  // 1. Create Patient A and Patient B
  const pAId = `PAT-P1-A-${Date.now().toString().slice(-4)}`;
  const pBId = `PAT-P1-B-${Date.now().toString().slice(-4)}`;

  const regHW = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'health_worker',
      name: 'HW Phase 1 Tester',
      phone: `9899${Date.now().toString().slice(-6)}`,
      password: 'password123',
      facility_name: 'PHC Mulshi'
    })
  });
  assert(regHW.status === 201, `Register HW Tester (status=${regHW.status})`);
  const hwToken = regHW.body.token;

  const regDoctorA = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'doctor',
      name: 'Dr. Notification Alpha',
      phone: `9799${Date.now().toString().slice(-6)}`,
      password: 'password123',
      specialty: 'Cardiology'
    })
  });
  assert(regDoctorA.status === 201, `Register Doctor A (user_id=${regDoctorA.body.user.user_id})`);
  const docAToken = regDoctorA.body.token;
  const docAUserId = regDoctorA.body.user.user_id;

  const regDoctorB = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'doctor',
      name: 'Dr. Notification Beta',
      phone: `9699${Date.now().toString().slice(-6)}`,
      password: 'password123',
      specialty: 'Neurology'
    })
  });
  assert(regDoctorB.status === 201, `Register Doctor B (user_id=${regDoctorB.body.user.user_id})`);
  const docBToken = regDoctorB.body.token;

  // Patient A Registration
  const regPatA = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'patient',
      name: 'Patient Alpha',
      phone: `9599${Date.now().toString().slice(-6)}`,
      password: 'password123'
    })
  });
  assert(regPatA.status === 201, `Register Patient A (patient_id=${regPatA.body.user.patient_id})`);
  const patAToken = regPatA.body.token;
  const patAPatientId = regPatA.body.user.patient_id;

  // Patient B Registration
  const regPatB = await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      role: 'patient',
      name: 'Patient Beta',
      phone: `9499${Date.now().toString().slice(-6)}`,
      password: 'password123'
    })
  });
  assert(regPatB.status === 201, `Register Patient B (patient_id=${regPatB.body.user.patient_id})`);
  const patBToken = regPatB.body.token;

  // 2. Test Follow-up Creation -> Patient A Notification
  const createFup = await request('/followups', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hwToken}` },
    body: JSON.stringify({
      patient_id: patAPatientId,
      followup_date: '2026-09-15',
      reason: 'Hypertension Follow-up Checkup',
      type: 'Routine'
    })
  });
  assert(createFup.status === 201, `Create Follow-up for Patient A (status=${createFup.status})`);

  // 3. Verify Patient A Notification Inbox
  const getNotifPatA = await request('/notifications', {
    headers: { Authorization: `Bearer ${patAToken}` }
  });
  assert(getNotifPatA.status === 200, `Fetch Notifications for Patient A`);
  const patANotifs = getNotifPatA.body.notifications || [];
  const foundFupNotifA = patANotifs.find(n => n.message.includes('Hypertension Follow-up Checkup'));
  assert(!!foundFupNotifA, `Patient A received follow-up notification (found=true)`);

  // 4. Verify Patient B Notification Isolation
  const getNotifPatB = await request('/notifications', {
    headers: { Authorization: `Bearer ${patBToken}` }
  });
  assert(getNotifPatB.status === 200, `Fetch Notifications for Patient B`);
  const patBNotifs = getNotifPatB.body.notifications || [];
  const foundFupNotifB = patBNotifs.find(n => n.message.includes('Hypertension Follow-up Checkup'));
  assert(!foundFupNotifB, `Patient B did NOT receive Patient A follow-up notification (isolated=true)`);

  // 5. Test Targeted Notification for Doctor A
  const createTriageDocA = await request('/triage', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hwToken}` },
    body: JSON.stringify({
      patient_id: patAPatientId,
      assigned_doctor_id: docAUserId,
      temperature: 38.5,
      spo2: 96,
      priority: 'HIGH',
      symptoms: ['Fever', 'Cough'],
      notes: 'Direct assignment to Dr Alpha'
    })
  });
  assert(createTriageDocA.status === 201, `HW Assign Triage to Doctor A`);

  // Fetch Doctor A Notifications
  const getNotifDocA = await request('/notifications', {
    headers: { Authorization: `Bearer ${docAToken}` }
  });
  assert(getNotifDocA.status === 200, `Fetch Notifications for Doctor A`);
  const docANotifs = getNotifDocA.body.notifications || [];
  const docATriageNotif = docANotifs.find(n => n.message.includes(patAPatientId) || n.title.includes('Triage'));
  assert(!!docATriageNotif, `Doctor A received assigned triage notification`);

  // Fetch Doctor B Notifications
  const getNotifDocB = await request('/notifications', {
    headers: { Authorization: `Bearer ${docBToken}` }
  });
  assert(getNotifDocB.status === 200, `Fetch Notifications for Doctor B`);
  const docBNotifs = getNotifDocB.body.notifications || [];
  const docBTriageNotif = docBNotifs.find(n => n.message.includes(patAPatientId) || (n.title.includes('Triage') && n.recipient_id === docAUserId));
  assert(!docBTriageNotif, `Doctor B did NOT receive Doctor A triage notification (isolated=true)`);

  // 6. Test Read Status Persistence in MongoDB
  if (foundFupNotifA) {
    const markRead = await request(`/notifications/${foundFupNotifA.notification_id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${patAToken}` }
    });
    assert(markRead.status === 200 && markRead.body.notification.read === true, `Mark Patient A notification as READ (read=true)`);

    // Fetch again to verify persistence
    const reGetNotifPatA = await request('/notifications', {
      headers: { Authorization: `Bearer ${patAToken}` }
    });
    const reFound = (reGetNotifPatA.body.notifications || []).find(n => n.notification_id === foundFupNotifA.notification_id);
    assert(reFound && reFound.read === true, `Notification read status persists in MongoDB after refetch (read=true)`);
  }

  console.log('\n============================================================');
  console.log(` PHASE 1 SCORE: ${passed} / ${total} TESTS PASSED`);
  console.log('============================================================');
}

runPhase1Tests().catch(console.error);
