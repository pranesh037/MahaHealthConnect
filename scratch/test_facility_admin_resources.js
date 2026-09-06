const API_BASE = 'http://localhost:4000/api';

async function testFacilityAdminResources() {
  console.log('=== STARTING RESOURCE UPDATE & PROPAGATION TEST ===');

  // 1. Admin B Login (FAC-103)
  const adminBLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-ADM-003', password: 'admin123' })
  });
  const tokenB = (await adminBLoginRes.json()).token;
  console.log('✓ Facility Admin B Logged In: USR-ADM-003 (FAC-103)');

  // 2. District Officer Login
  const distLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-DST-001', password: 'district123' })
  });
  const distToken = (await distLoginRes.json()).token;
  console.log('✓ District Authority Logged In: USR-DST-001');

  // 3. Update Bed Capacity on FAC-103
  const bedRes = await fetch(`${API_BASE}/facilities/FAC-103/resources`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${tokenB}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ active_beds: 45, available_beds: 12, icu_beds: 5, available_icu_beds: 2 })
  });
  const bedData = await bedRes.json();
  if (!bedRes.ok) throw new Error(`Bed update failed: ${JSON.stringify(bedData)}`);
  console.log(`✓ Bed Capacity Updated on FAC-103: ${bedData.facility.available_beds} available / ${bedData.facility.active_beds} active`);

  // 4. Update Medicine Stock on FAC-103
  const medListRes = await fetch(`${API_BASE}/medicines`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const medList = (await medListRes.json()).medicines || [];
  const medToUpdate = medList.find(m => m.facility_id === 'FAC-103') || medList[0];
  if (!medToUpdate) throw new Error('No medicine records in database');

  const medRes = await fetch(`${API_BASE}/medicines/${medToUpdate.medicine_id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${tokenB}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ current_stock: 35, min_safety_stock: 10 })
  });
  const medData = await medRes.json();
  if (!medRes.ok) throw new Error(`Medicine update failed: ${JSON.stringify(medData)}`);
  console.log(`✓ Medicine Stock Updated for ${medToUpdate.medicine_id}: ${medData.medicine.current_stock} (Status: ${medData.medicine.status})`);

  // 5. Update Doctor Availability on USR-DOC-003
  const docRes = await fetch(`${API_BASE}/doctors/USR-DOC-003/availability`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${tokenB}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ availability_status: 'AVAILABLE' })
  });
  const docData = await docRes.json();
  if (!docRes.ok) throw new Error(`Doctor update failed: ${JSON.stringify(docData)}`);
  console.log(`✓ Doctor Availability Updated for USR-DOC-003: ${docData.doctor.availability_status}`);

  // 6. District Authority Verification Query
  const distFacRes = await fetch(`${API_BASE}/facilities`, {
    headers: { 'Authorization': `Bearer ${distToken}` }
  });
  const facilities = (await distFacRes.json()).facilities || [];
  const fac103 = facilities.find(f => f.facility_id === 'FAC-103');
  console.log(`✓ District Authority View FAC-103 Available Beds: ${fac103?.available_beds} (Expected: 12)`);
  if (fac103?.available_beds !== 12) {
    throw new Error('District view bed capacity propagation failed!');
  }

  const distMedRes = await fetch(`${API_BASE}/medicines`, {
    headers: { 'Authorization': `Bearer ${distToken}` }
  });
  const medicines = (await distMedRes.json()).medicines || [];
  const updatedMed = medicines.find(m => m.medicine_id === medToUpdate.medicine_id);
  console.log(`✓ District Authority View ${medToUpdate.medicine_id} Stock: ${updatedMed?.current_stock} (Expected: 35)`);
  if (updatedMed?.current_stock !== 35) {
    throw new Error('District view medicine stock propagation failed!');
  }

  console.log('=== ALL RESOURCE PROPAGATION ASSERTIONS PASSED ===');
}

testFacilityAdminResources().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
