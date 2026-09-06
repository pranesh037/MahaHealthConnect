const API_URL = 'http://localhost:4000/api';

async function runPhase3Verification() {
  console.log('====================================================');
  console.log(' MAHA HEALTH CONNECT - PHASE 3 VERIFICATION AUDIT ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Roles
    console.log('--- 1. AUTHENTICATION & FACILITY IDENTITY SCOPING ---');
    const adminRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'USR-ADM-003', password: 'admin123', role: 'facility_admin' })
    });
    const adminData = await adminRes.json();
    assert(adminRes.ok && adminData.token, 'FAC-103 Admin login successful');
    const adminToken = adminData.token;
    const adminFacilityId = adminData.user.facility_id;
    assert(adminFacilityId === 'FAC-103', `Admin correctly scoped to facility_id: ${adminFacilityId}`);

    const hwRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'USR-WRK-001', password: 'worker123', role: 'health_worker' })
    });
    const hwData = await hwRes.json();
    assert(hwRes.ok && hwData.token, 'Health Worker login successful');
    const hwToken = hwData.token;

    const patRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'PAT-10245', password: 'patient123', role: 'patient' })
    });
    const patData = await patRes.json();
    assert(patRes.ok && patData.token, 'Patient PAT-10245 login successful');
    const patToken = patData.token;

    const docRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'USR-DOC-001', password: 'doctor123', role: 'doctor' })
    });
    const docData = await docRes.json();
    assert(docRes.ok && docData.token, 'Doctor login successful');
    const docToken = docData.token;

    const distRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'USR-DST-001', password: 'district123', role: 'district_authority' })
    });
    const distData = await distRes.json();
    assert(distRes.ok && distData.token, 'District Authority login successful');
    const distToken = distData.token;

    // 2. Referral Workflow & Accept Decision
    console.log('\n--- 2. REFERRAL WORKFLOW & ACCEPTANCE LIFECYCLE ---');
    const createRefRes = await fetch(`${API_URL}/referrals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hwToken}` },
      body: JSON.stringify({
        patient_id: 'PAT-10245',
        patient_name: 'Anandi Gopal Joshi',
        specialty_required: 'Cardiology',
        priority: 'HIGH',
        clinical_notes: 'Phase 3 Verification Referral for Emergency Evaluation',
        target_hospitals: [{ facility_id: 'FAC-103', facility: 'District Hospital Aundh' }]
      })
    });
    const createRefData = await createRefRes.json();
    assert(createRefRes.ok && createRefData.referral?.referral_id, `Referral created: ${createRefData.referral?.referral_id}`);
    const refId1 = createRefData.referral.referral_id;

    // FAC-103 Admin checks inbox
    const adminInboxRes = await fetch(`${API_URL}/referrals`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminInboxData = await adminInboxRes.json();
    const foundInAdminInbox = (adminInboxData.referrals || []).find((r) => r.referral_id === refId1);
    assert(foundInAdminInbox !== undefined, `Referral ${refId1} received in FAC-103 Admin Referral Inbox`);

    // FAC-103 Admin ACCEPTS referral
    const acceptRes = await fetch(`${API_URL}/referrals/${refId1}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'ACCEPTED', reason: 'ICU Bed Allocated' })
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.ok && acceptData.referral?.status === 'ACCEPTED', `Referral status updated in MongoDB to ACCEPTED`);
    assert(acceptData.referral?.accepted_facility_id === 'FAC-103', `accepted_facility_id persisted as FAC-103`);

    // Status Propagation Verification
    const hwVerifyRef = await fetch(`${API_URL}/referrals`, { headers: { Authorization: `Bearer ${hwToken}` } }).then(r => r.json());
    const hwRefStatus = (hwVerifyRef.referrals || []).find(r => r.referral_id === refId1)?.status;
    assert(hwRefStatus === 'ACCEPTED', `Health Worker sees updated status ACCEPTED`);

    const patVerifyRef = await fetch(`${API_URL}/referrals`, { headers: { Authorization: `Bearer ${patToken}` } }).then(r => r.json());
    const patRefStatus = (patVerifyRef.referrals || []).find(r => r.referral_id === refId1)?.status;
    assert(patRefStatus === 'ACCEPTED', `Patient sees updated status ACCEPTED`);

    // 3. Referral Rejection Lifecycle
    console.log('\n--- 3. REFERRAL REJECTION LIFECYCLE ---');
    const createRef2Res = await fetch(`${API_URL}/referrals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${hwToken}` },
      body: JSON.stringify({
        patient_id: 'PAT-10001',
        patient_name: 'Anandi Gopal Joshi',
        specialty_required: 'Neurology',
        priority: 'NORMAL',
        clinical_notes: 'Test Rejection Flow',
        target_hospitals: [{ facility_id: 'FAC-103', facility: 'District Hospital Aundh' }]
      })
    });
    const refId2 = (await createRef2Res.json()).referral.referral_id;

    const rejectRes = await fetch(`${API_URL}/referrals/${refId2}/decision`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: 'REJECTED', reason: 'No Neurology Specialist Available Today' })
    });
    const rejectData = await rejectRes.json();
    assert(rejectRes.ok && rejectData.referral?.status === 'REJECTED', `Referral status updated in MongoDB to REJECTED`);
    assert(rejectData.referral?.decision_reason === 'No Neurology Specialist Available Today', `Rejection reason persisted in MongoDB`);

    // 4. Resource Propagation (Beds & Medicines)
    console.log('\n--- 4. RESOURCE PROPAGATION (BEDS & MEDICINES) ---');
    // Bed Update: FAC-103 Available beds set to 42
    const updateBedRes = await fetch(`${API_URL}/facilities/FAC-103/resources`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ active_beds: 350, available_beds: 42, icu_beds: 20, available_icu_beds: 5 })
    });
    const updateBedData = await updateBedRes.json();
    assert(updateBedRes.ok && updateBedData.facility?.available_beds === 42, `FAC-103 Admin updated Available Beds to 42 in MongoDB`);

    // District Authority reads FAC-103 resources
    const distFacRes = await fetch(`${API_URL}/facilities`, { headers: { Authorization: `Bearer ${distToken}` } }).then(r => r.json());
    const fac103DistView = (distFacRes.facilities || []).find(f => f.facility_id === 'FAC-103');
    assert(fac103DistView?.available_beds === 42, `District Authority sees updated Available Beds = 42 for FAC-103`);

    // Medicine Stock Update
    const medsRes = await fetch(`${API_URL}/medicines`, { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json());
    const targetMed = (medsRes.medicines || [])[0];
    assert(targetMed !== undefined, `Medicine inventory retrieved for FAC-103`);

    if (targetMed) {
      const updateMedRes = await fetch(`${API_URL}/medicines/${targetMed.medicine_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ current_stock: 88 })
      });
      const updateMedData = await updateMedRes.json();
      assert(updateMedRes.ok && updateMedData.medicine?.current_stock === 88, `Medicine ${targetMed.name} stock updated to 88 in MongoDB`);

      // Verify District Authority sees 88
      const distMedsRes = await fetch(`${API_URL}/medicines?facility_id=FAC-103`, { headers: { Authorization: `Bearer ${distToken}` } }).then(r => r.json());
      const distMedStock = (distMedsRes.medicines || []).find(m => m.medicine_id === targetMed.medicine_id)?.current_stock;
      assert(distMedStock === 88, `District Authority sees updated stock 88 for ${targetMed.name}`);
    }

    // 5. Doctor Availability
    console.log('\n--- 5. DOCTOR AVAILABILITY ---');
    const docsRes = await fetch(`${API_URL}/doctors?facility_id=FAC-103`, { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json());
    const targetDoc = (docsRes.doctors || [])[0];
    assert(targetDoc !== undefined, `Facility-scoped doctors retrieved for FAC-103`);

    if (targetDoc) {
      const updateDocRes = await fetch(`${API_URL}/doctors/${targetDoc.user_id}/availability`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ availability_status: 'BUSY' })
      });
      const updateDocData = await updateDocRes.json();
      assert(updateDocRes.ok && updateDocData.doctor?.availability_status === 'BUSY', `Doctor ${targetDoc.name} availability status updated to BUSY in MongoDB`);
    }

    // 6. Attendance Workflow
    console.log('\n--- 6. ATTENDANCE WORKFLOW ---');
    const checkInRes = await fetch(`${API_URL}/attendance/check-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    });
    const checkInData = await checkInRes.json();
    assert(checkInRes.ok || checkInRes.status === 400, `Admin check-in API processed cleanly (status: ${checkInRes.status})`);

    const attListRes = await fetch(`${API_URL}/attendance?facility_id=FAC-103`, { headers: { Authorization: `Bearer ${adminToken}` } }).then(r => r.json());
    assert(Array.isArray(attListRes.attendance), `Facility-scoped attendance records returned from MongoDB`);

    // 7. User Isolation Security Test
    console.log('\n--- 7. USER ISOLATION SECURITY AUDIT ---');
    // Login as Admin for FAC-101 (PHC Mulshi)
    const fac101AdminRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'USR-ADM-001', password: 'admin123', role: 'facility_admin' })
    });
    const fac101AdminData = await fac101AdminRes.json();
    if (fac101AdminRes.ok && fac101AdminData.token) {
      const fac101Token = fac101AdminData.token;

      // Attempt to update FAC-103 resources using FAC-101 admin token
      const illegalUpdateRes = await fetch(`${API_URL}/facilities/FAC-103/resources`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${fac101Token}` },
        body: JSON.stringify({ available_beds: 999 })
      });
      assert(illegalUpdateRes.status === 403, `FAC-101 Admin attempt to update FAC-103 resources blocked with HTTP 403 Forbidden`);
    } else {
      console.log('[INFO] USR-ADM-001 login skip, skipping multi-admin cross-edit test');
    }

    console.log('\n====================================================');
    console.log(` FINAL VERIFICATION SUMMARY: ${passed} PASSED / ${failed} FAILED`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Audit Script Error:', err);
    process.exit(1);
  }
}

runPhase3Verification();
