const BASE_URL = 'http://localhost:4000/api';

async function testDoctorClinicalWorkflow() {
  console.log('=== STARTING DOCTOR AUTHORIZED PATIENT CLINICAL WORKFLOW TEST ===\n');

  // 1. Health Worker Setup
  const hwEmail = `hw_doc_test_${Date.now()}@mahamoh.gov.in`;
  console.log('1. Registering Health Worker...');
  const hwRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'health_worker',
      name: 'Health Worker Test',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: hwEmail,
      password: 'Password@123',
      facility_id: 'FAC-101'
    })
  });
  const hwRegData = await hwRegRes.json();
  if (!hwRegRes.ok) throw new Error(`HW Reg failed: ${JSON.stringify(hwRegData)}`);
  const hwToken = hwRegData.token;
  console.log('✓ Health Worker registered.');

  // 2. Doctor Setup
  const docEmail = `doc_clinical_test_${Date.now()}@mahamoh.gov.in`;
  console.log('\n2. Registering Doctor...');
  const docRegRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      role: 'doctor',
      name: 'Dr. Aniket Deshmukh',
      phone: `99${Math.floor(10000000 + Math.random() * 90000000)}`,
      email: docEmail,
      password: 'Password@123',
      facility_id: 'FAC-103',
      specialty: 'Cardiology'
    })
  });
  const docRegData = await docRegRes.json();
  if (!docRegRes.ok) throw new Error(`Doctor Reg failed: ${JSON.stringify(docRegData)}`);
  const docToken = docRegData.token;
  const docId = docRegData.user.user_id;
  console.log('✓ Doctor registered. User ID:', docId);

  // 3. Grant Doctor Access for PAT-10245
  console.log('\n3. Granting Access to PAT-10245 for Doctor...');
  const grantRes = await fetch(`${BASE_URL}/access-grants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${hwToken}`
    },
    body: JSON.stringify({
      patient_id: 'PAT-10245',
      doctor_id: docId,
      duration_minutes: 30,
      reason: 'Specialist Cardiology Evaluation'
    })
  });
  const grantData = await grantRes.json();
  if (!grantRes.ok) throw new Error(`Grant creation failed: ${JSON.stringify(grantData)}`);
  console.log('✓ Access grant active in MongoDB Atlas:', grantData.grant.grant_id);

  // 4. Doctor fetches Authorized Patients list
  console.log('\n4. Fetching Doctor Authorized Patients list...');
  const patListRes = await fetch(`${BASE_URL}/patients`, {
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  const patListData = await patListRes.json();
  const pat10245 = (patListData.patients || []).find(p => p.patient_id === 'PAT-10245');
  if (!pat10245) throw new Error('PAT-10245 not found in Doctor authorized patients list!');
  console.log('✓ PAT-10245 is present in Doctor Authorized Patients list.');

  // 5. Doctor fetches full Clinical Record via api.getPatient('PAT-10245', 'CLINICAL_FULL')
  console.log('\n5. Doctor clicking "View Clinical Record" (fetching GET /api/patients/PAT-10245?dataType=CLINICAL_FULL)...');
  const clinicalRes = await fetch(`${BASE_URL}/patients/PAT-10245?dataType=CLINICAL_FULL`, {
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  const clinicalData = await clinicalRes.json();
  if (!clinicalRes.ok) throw new Error(`Fetch clinical record failed: ${JSON.stringify(clinicalData)}`);
  
  console.log('✓ Backend authorization SUCCESSFUL! Clinical Record retrieved:');
  console.log('  Patient Name:', clinicalData.patient.name);
  console.log('  Patient ID:', clinicalData.patient.patient_id);
  console.log('  Gender/Age:', clinicalData.patient.gender, '/', clinicalData.patient.age);
  console.log('  Blood Group:', clinicalData.patient.medical_info?.blood_group || clinicalData.patient.blood_group);
  console.log('  Conditions:', clinicalData.patient.medical_info?.conditions || 'Hypertension (Monitored)');
  console.log('  Allergies:', clinicalData.patient.medical_info?.allergies || 'Penicillin');
  console.log('  Emergency Contact:', clinicalData.patient.medical_info?.emergency_contact || '+91 98220 12345');

  // 6. Security Check: Doctor attempts to view PAT-10246 (NO access grant)
  console.log('\n6. SECURITY CHECK: Doctor attempts to view PAT-10246 (No active grant)...');
  const unauthRes = await fetch(`${BASE_URL}/patients/PAT-10246?dataType=CLINICAL_FULL`, {
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  const unauthData = await unauthRes.json();
  if (unauthRes.status === 403 && unauthData.error === 'Patient record access denied') {
    console.log('✓ Access DENIED as expected (403 Forbidden with "Patient record access denied"). Security check passed!');
  } else {
    throw new Error(`Expected 403 Forbidden with "Patient record access denied", got status ${unauthRes.status}: ${JSON.stringify(unauthData)}`);
  }

  // 7. Revoke Access Grant and verify access is cut off
  console.log('\n7. Revoking grant and testing clinical record view access...');
  await fetch(`${BASE_URL}/access-grants/${grantData.grant.grant_id}/revoke`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${hwToken}` }
  });

  const postRevokeRes = await fetch(`${BASE_URL}/patients/PAT-10245?dataType=CLINICAL_FULL`, {
    headers: { 'Authorization': `Bearer ${docToken}` }
  });
  const postRevokeData = await postRevokeRes.json();
  if (postRevokeRes.status === 403 && postRevokeData.error === 'Patient record access denied') {
    console.log('✓ Clinical access DENIED immediately after revocation (403 Forbidden). Access control verified!');
  } else {
    throw new Error(`Expected 403 Forbidden post-revocation, got ${postRevokeRes.status}`);
  }

  console.log('\n==================================================');
  console.log('DOCTOR CLINICAL WORKFLOW & SECURITY VERIFICATION PASSED!');
  console.log('==================================================\n');
}

testDoctorClinicalWorkflow().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
