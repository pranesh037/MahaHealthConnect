import 'dotenv/config';
import http from 'node:http';
import { spawn } from 'node:child_process';

const PORT = 4005;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let serverProcess = null;

function startServerProcess() {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, PORT: String(PORT) };
    serverProcess = spawn('node', ['backend/server.js'], { env, stdio: 'inherit' });

    let attempts = 0;
    const checkHealth = async () => {
      attempts++;
      try {
        const res = await request('GET', '/health');
        if (res.status === 200) {
          console.log('Backend server process started successfully');
          resolve();
          return;
        }
      } catch {
        // Retry
      }
      if (attempts > 120) {
        reject(new Error('Server failed to start within timeout'));
      } else {
        setTimeout(checkHealth, 500);
      }
    };
    checkHealth();
  });
}

async function stopServerProcess() {
  if (serverProcess) {
    console.log('Stopping backend server process...');
    serverProcess.kill('SIGTERM');
    await sleep(2000);
    serverProcess = null;
  }
}

async function runPersistenceTests() {
  console.log('--- STARTING MONGODB PERSISTENCE RESTART TESTS ---');

  // Step 1: Start Server Instance 1
  await startServerProcess();

  // Health check
  const healthRes = await request('GET', '/health');
  console.log('1. MongoDB Health check:', healthRes.data);
  if (healthRes.status !== 200 || !healthRes.data.persistence?.connected) {
    throw new Error('MongoDB connection health check failed');
  }

  // Step 2: Login as Health Worker
  const hwLogin = await request('POST', '/auth/login', { username: 'USR-HW-002', password: 'worker123', role: 'health_worker' });
  if (hwLogin.status !== 200 || !hwLogin.data.token) {
    throw new Error(`Health Worker login failed: ${JSON.stringify(hwLogin.data)}`);
  }
  const hwToken = hwLogin.data.token;
  console.log('2. Health worker logged in successfully');

  // Step 3: Login as Facility Admin
  const adminLogin = await request('POST', '/auth/login', { username: 'USR-ADM-004', password: 'admin123', role: 'facility_admin' });
  if (adminLogin.status !== 200 || !adminLogin.data.token) {
    throw new Error(`Facility Admin login failed: ${JSON.stringify(adminLogin.data)}`);
  }
  const adminToken = adminLogin.data.token;
  console.log('3. Facility admin logged in successfully');

  // Step 4: Create Patient
  const uniquePhone = `9876${Date.now().toString().slice(-6)}`;
  const createPatientRes = await request('POST', '/patients', {
    name: 'Persistent Test Patient',
    age: 42,
    gender: 'Female',
    phone: uniquePhone,
    village: 'Mulshi Gaon',
    district: 'Pune'
  }, hwToken);

  console.log('4. Create Patient response status:', createPatientRes.status);
  if (createPatientRes.status !== 201 || !createPatientRes.data.patient?.patient_id) {
    throw new Error(`Create patient failed: ${JSON.stringify(createPatientRes.data)}`);
  }
  const testPatientId = createPatientRes.data.patient.patient_id;
  console.log(`-> Created patient ID: ${testPatientId}`);

  // Step 5: Retrieve Patient before restart
  const getPatientBefore = await request('GET', `/patients/${testPatientId}`, null, hwToken);
  if (getPatientBefore.status !== 200 || getPatientBefore.data.patient?.name !== 'Persistent Test Patient') {
    throw new Error(`Retrieve patient before restart failed: ${JSON.stringify(getPatientBefore.data)}`);
  }
  console.log('5. Retrieved created patient successfully before restart');

  // Step 6: Create Referral
  const createReferralRes = await request('POST', '/referrals', {
    patient_id: testPatientId,
    patient_name: 'Persistent Test Patient',
    specialty_required: 'Cardiology',
    priority: 'HIGH',
    clinical_notes: 'Persistent referral test note'
  }, hwToken);

  if (createReferralRes.status !== 201 || !createReferralRes.data.referral?.referral_id) {
    throw new Error(`Create referral failed: ${JSON.stringify(createReferralRes.data)}`);
  }
  const testReferralId = createReferralRes.data.referral.referral_id;
  console.log(`6. Created referral ID: ${testReferralId}`);

  // Step 7: Update Facility Resource
  const updateResourceRes = await request('PATCH', '/facilities/FAC-103/resources', {
    active_beds: 399
  }, adminToken);
  console.log('Update facility response payload:', updateResourceRes.data);

  if (updateResourceRes.status !== 200 || updateResourceRes.data.facility?.active_beds !== 399) {
    throw new Error(`Update facility resource failed: ${JSON.stringify(updateResourceRes.data)}`);
  }
  console.log('7. Updated facility FAC-103 active_beds to 399');

  // Step 8: RESTART BACKEND SERVER
  console.log('\n--- RESTARTING BACKEND SERVER PROCESS ---');
  await stopServerProcess();
  await sleep(1000);
  await startServerProcess();
  console.log('--- BACKEND SERVER RESTARTED SUCCESSFULLY ---\n');

  // Step 9: Re-login after restart
  const hwLogin2 = await request('POST', '/auth/login', { username: 'USR-HW-002', password: 'worker123', role: 'health_worker' });
  const hwToken2 = hwLogin2.data.token;
  const adminLogin2 = await request('POST', '/auth/login', { username: 'USR-ADM-004', password: 'admin123', role: 'facility_admin' });
  const adminToken2 = adminLogin2.data.token;

  // Step 10: Retrieve Patient AFTER RESTART
  const getPatientAfter = await request('GET', `/patients/${testPatientId}`, null, hwToken2);
  console.log('10. Retrieve Patient after restart status:', getPatientAfter.status);
  if (getPatientAfter.status !== 200 || getPatientAfter.data.patient?.name !== 'Persistent Test Patient') {
    throw new Error(`FAIL: Patient was NOT persisted across backend restart! ${JSON.stringify(getPatientAfter.data)}`);
  }
  console.log('✅ SUCCESS: Patient persisted across backend restart!');

  // Step 11: Retrieve Referral AFTER RESTART
  const getReferralsAfter = await request('GET', '/referrals', null, hwToken2);
  console.log('Referrals returned after restart:', getReferralsAfter.data.referrals);
  console.log('Looking for testReferralId:', testReferralId);
  const foundReferral = (getReferralsAfter.data.referrals || []).find((r) => r.referral_id === testReferralId);
  if (getReferralsAfter.status !== 200 || !foundReferral) {
    throw new Error('FAIL: Referral was NOT persisted across backend restart!');
  }
  console.log('✅ SUCCESS: Referral persisted across backend restart!');

  // Step 12: Retrieve Facility Resource AFTER RESTART
  const getFacilitiesAfter = await request('GET', '/facilities', null, adminToken2);
  console.log('Facilities returned after restart:', getFacilitiesAfter.data.facilities);
  const fac103 = (getFacilitiesAfter.data.facilities || []).find((f) => f.facility_id === 'FAC-103');
  if (getFacilitiesAfter.status !== 200 || fac103?.active_beds !== 399) {
    throw new Error(`FAIL: Facility resource update was NOT persisted across restart! Found: ${fac103?.active_beds}`);
  }
  console.log('✅ SUCCESS: Facility resource update persisted across backend restart!');

  console.log('\n--- ALL MONGODB PERSISTENCE RESTART TESTS PASSED PERFECTLY! ---');
}

runPersistenceTests()
  .then(async () => {
    await stopServerProcess();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('PERSISTENCE TEST FAILED:', err);
    await stopServerProcess();
    process.exit(1);
  });
