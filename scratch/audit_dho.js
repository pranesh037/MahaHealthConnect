async function auditMongoDistricts() {
  const loginRes = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'USR-DST-001', password: 'district123' })
  }).then(r => r.json());

  console.log('=== 1. Authenticated DHO User ===');
  console.log('user_id:', loginRes.user?.user_id);
  console.log('role:', loginRes.user?.role);
  console.log('district:', JSON.stringify(loginRes.user?.district));
  console.log('jurisdiction:', JSON.stringify(loginRes.user?.jurisdiction));

  const token = loginRes.token;
  const headers = { Authorization: 'Bearer ' + token };

  const facsRes = await fetch('http://localhost:4000/api/facilities', { headers }).then(r => r.json());
  const allFacs = facsRes.facilities || facsRes.data || [];
  console.log('\n=== 2. Total Facilities from API ===', allFacs.length);

  const districtCounts = {};
  allFacs.forEach(f => {
    districtCounts[f.district] = (districtCounts[f.district] || 0) + 1;
  });
  console.log('=== 3. Distinct Facility District counts ===', districtCounts);

  console.log('\n=== 4. First 15 Facilities ===');
  allFacs.slice(0, 15).forEach(f => {
    console.log(`${f.facility_id} | ${f.name} | district: "${f.district}" | taluka: "${f.taluka}"`);
  });
}
auditMongoDistricts().catch(console.error);
