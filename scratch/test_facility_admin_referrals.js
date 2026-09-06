const API_BASE = 'http://localhost:4000/api';

async function testFacilityAdminReferrals() {
  console.log('=== STARTING E2E REFERRAL ROUTING & LIFECYCLE TEST ===');

  // 1. Health Worker Login
  const hwLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-WRK-001', password: 'worker123' })
  });
  const hwData = await hwLoginRes.json();
  if (!hwLoginRes.ok || !hwData.token) throw new Error('HW login failed');
  const hwToken = hwData.token;
  console.log(`✓ Health Worker Logged In: ${hwData.user.user_id}`);

  // 2. Admin A Login (FAC-101) & Admin B Login (FAC-103)
  const adminALoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-ADM-001', password: 'admin123' })
  });
  const tokenA = (await adminALoginRes.json()).token;

  const adminBLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-ADM-003', password: 'admin123' })
  });
  const adminBLoginData = await adminBLoginRes.json();
  const tokenB = adminBLoginData.token;
  console.log(`Admin B User Info:`, adminBLoginData.user);

  // 3. Create Referral Targeted to FAC-103
  const refPayload = {
    patient_id: 'PAT-10245',
    patient_name: 'Anandi Patil',
    referring_facility_id: 'FAC-101',
    referring_facility_name: 'PHC Mulshi',
    target_facility_id: 'FAC-103',
    target_facility_name: 'District Hospital Aundh',
    specialty_required: 'Cardiology',
    priority: 'HIGH',
    clinical_notes: 'Chest pain evaluation required'
  };

  const createRes = await fetch(`${API_BASE}/referrals`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hwToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(refPayload)
  });
  const createData = await createRes.json();
  if (!createRes.ok || !createData.referral) {
    throw new Error(`Referral creation failed: ${JSON.stringify(createData)}`);
  }
  const refId = createData.referral.referral_id;
  console.log(`✓ Created Test Referral:`, createData.referral);

  // 4. Verify FAC-101 Admin Inbox does NOT contain refId as incoming
  const refsARes = await fetch(`${API_BASE}/referrals`, {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const refsA = (await refsARes.json()).referrals || [];
  const inAInbox = refsA.some(r => r.referral_id === refId && r.target_facility_id === 'FAC-101');
  console.log(`✓ Is Referral in FAC-101 Admin Incoming Inbox? ${inAInbox} (Expected: false)`);
  if (inAInbox) {
    throw new Error('BUG: Referral targeted to FAC-103 appeared in FAC-101 Admin Inbox!');
  }

  // 5. Verify FAC-103 Admin Inbox DOES contain refId
  const refsBRes = await fetch(`${API_BASE}/referrals`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const refsB = (await refsBRes.json()).referrals || [];
  const targetRefB = refsB.find(r => r.referral_id === refId);
  console.log(`✓ Is Referral in FAC-103 Admin Inbox? ${Boolean(targetRefB)} (Expected: true)`);
  if (!targetRefB) {
    throw new Error('BUG: Referral targeted to FAC-103 missing from FAC-103 Admin Inbox!');
  }

  // 6. Admin A (FAC-101) attempts to accept FAC-103 referral -> Expect 403
  const illegalDecRes = await fetch(`${API_BASE}/referrals/${refId}/decision`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'ACCEPTED', reason: 'Illegal acceptance attempt' })
  });
  console.log(`Admin A cross-facility decision status: ${illegalDecRes.status}`);
  if (illegalDecRes.status !== 403) {
    throw new Error(`SECURITY VULNERABILITY: Admin A accepted FAC-103 referral with status ${illegalDecRes.status}`);
  }
  console.log('✓ PASS: Cross-facility referral decision rejected with HTTP 403 Forbidden!');

  // 7. Admin B (FAC-103) accepts referral
  const decResB = await fetch(`${API_BASE}/referrals/${refId}/decision`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${tokenB}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'ACCEPTED', reason: 'ICU Bed & Cardiologist available' })
  });
  const decDataB = await decResB.json();
  if (!decResB.ok || !decDataB.referral) {
    throw new Error(`Admin B decision failed: ${JSON.stringify(decDataB)}`);
  }
  const acceptedRef = decDataB.referral;
  console.log(`✓ Admin B Accepted Referral: ${acceptedRef.referral_id}`);
  console.log(`✓ Accepted By User: ${acceptedRef.accepted_by} (Expected: USR-ADM-003)`);
  console.log(`✓ Accepted Facility: ${acceptedRef.accepted_facility_id} (Expected: FAC-103)`);

  if (acceptedRef.accepted_by !== 'USR-ADM-003' || acceptedRef.accepted_facility_id !== 'FAC-103') {
    throw new Error('Inconsistent decision persistence fields!');
  }

  // 8. Status Propagation Verification across HW queries
  const hwRefsRes = await fetch(`${API_BASE}/referrals`, {
    headers: { 'Authorization': `Bearer ${hwToken}` }
  });
  const hwRef = ((await hwRefsRes.json()).referrals || []).find(r => r.referral_id === refId);
  console.log(`✓ Health Worker Sees Updated Status: ${hwRef?.status} (Expected: ACCEPTED)`);
  if (hwRef?.status !== 'ACCEPTED') {
    throw new Error('Status propagation to Health Worker failed!');
  }

  console.log('=== ALL REFERRAL ROUTING & LIFECYCLE ASSERTIONS PASSED ===');
}

testFacilityAdminReferrals().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
