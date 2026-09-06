const API_BASE = 'http://localhost:4000/api';

async function testFacilityAdminSecurity() {
  console.log('=== STARTING FACILITY ADMIN SECURITY & AUTHORIZATION TEST ===');

  // 1. Login Admin A (FAC-101)
  const adminALoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-ADM-001', password: 'admin123' })
  });
  const adminAData = await adminALoginRes.json();
  if (!adminALoginRes.ok || !adminAData.token) throw new Error('Admin A login failed');
  const tokenA = adminAData.token;
  console.log(`✓ Admin A Logged In: ${adminAData.user.user_id} (${adminAData.user.facility_id})`);

  // 2. Login Admin B (FAC-103)
  const adminBLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-ADM-003', password: 'admin123' })
  });
  const adminBData = await adminBLoginRes.json();
  if (!adminBLoginRes.ok || !adminBData.token) throw new Error('Admin B login failed');
  const tokenB = adminBData.token;
  console.log(`✓ Admin B Logged In: ${adminBData.user.user_id} (${adminBData.user.facility_id})`);

  // 3. Admin A tries to edit FAC-103 resources -> Expect 403
  const resEdit = await fetch(`${API_BASE}/facilities/FAC-103/resources`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ active_beds: 50, status: 'CRITICAL_CAPACITY' })
  });
  console.log(`Admin A cross-facility resource update status: ${resEdit.status}`);
  if (resEdit.status !== 403) {
    throw new Error(`SECURITY VULNERABILITY: Admin A cross-facility update succeeded with status ${resEdit.status}`);
  }
  console.log('✓ PASS: Cross-facility resource update rejected with HTTP 403 Forbidden!');

  // 4. Admin A tries to update FAC-103 Doctor Availability -> Expect 403
  const docEdit = await fetch(`${API_BASE}/doctors/USR-DOC-003/availability`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${tokenA}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ availability_status: 'AVAILABLE' })
  });
  console.log(`Admin A cross-facility doctor update status: ${docEdit.status}`);
  if (docEdit.status !== 403) {
    throw new Error(`SECURITY VULNERABILITY: Admin A cross-facility doctor update succeeded with status ${docEdit.status}`);
  }
  console.log('✓ PASS: Cross-facility doctor update rejected with HTTP 403 Forbidden!');

  // 5. Admin B updates own facility FAC-103 -> Expect 200/201
  const resEditB = await fetch(`${API_BASE}/facilities/FAC-103/resources`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${tokenB}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ active_beds: 45, status: 'AVAILABLE' })
  });
  console.log(`Admin B own-facility resource update status: ${resEditB.status}`);
  if (!resEditB.ok) {
    throw new Error(`Admin B resource update failed: ${resEditB.status}`);
  }
  console.log('✓ PASS: Authorized facility resource update succeeded for Admin B!');

  console.log('=== ALL SECURITY ASSERTIONS PASSED ===');
}

testFacilityAdminSecurity().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
