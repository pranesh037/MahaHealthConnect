const API_URL = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('mhc_access_token');
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const body = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'Request failed');
    error.status = response.status;
    error.details = body;
    throw error;
  }
  return body;
}

export const api = {
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  me: () => apiRequest('/me'),
  patients: (query = '') => apiRequest(`/patients${query ? `?q=${encodeURIComponent(query)}` : ''}`),
  createPatient: (patient) => apiRequest('/patients', { method: 'POST', body: JSON.stringify(patient) }),
  getPatient: (patientId, dataType) => apiRequest(`/patients/${encodeURIComponent(patientId)}${dataType ? `?dataType=${dataType}` : ''}`),
  saveTriage: (triage) => apiRequest('/triage', { method: 'POST', body: JSON.stringify(triage) }),
  triages: () => apiRequest('/triages'),
  facilities: () => apiRequest('/facilities'),
  districtDashboard: (facilityId) => apiRequest(`/district/dashboard${facilityId ? `?facility_id=${encodeURIComponent(facilityId)}` : ''}`),
  referralAnalytics: () => apiRequest('/referrals/analytics'),
  medicines: () => apiRequest('/medicines'),
  updateFacilityResources: (facilityId, data) => apiRequest(`/facilities/${facilityId}/resources`, { method: 'PATCH', body: JSON.stringify(data) }),
  matchFacilities: (requirements) => apiRequest('/facilities/match', { method: 'POST', body: JSON.stringify(requirements) }),
  appointments: () => apiRequest('/appointments'),
  createAppointment: (appointment) => apiRequest('/appointments', { method: 'POST', body: JSON.stringify(appointment) }),
  queue: () => apiRequest('/queue'),
  updateQueue: (id, status) => apiRequest(`/queue/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  referrals: () => apiRequest('/referrals'),
  createReferral: (referral) => apiRequest('/referrals', { method: 'POST', body: JSON.stringify(referral) }),

  decideReferral: (referralId, decision) => apiRequest(`/referrals/${referralId}/decision`, { method: 'PATCH', body: JSON.stringify(decision) }),
  accessGrants: () =>
    apiRequest('/access-grants'),

  createAccessGrant: (payload) =>
    apiRequest('/access-grants', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
  revokeAccessGrant: (grantId) =>
    apiRequest(`/access-grants/${grantId}/revoke`, {
      method: 'PATCH'
    }),
  createConsultation: (data) => apiRequest('/consultations', { method: 'POST', body: JSON.stringify(data) }),
  consultations: (query = '') => apiRequest(`/consultations${query}`),
  teleconsultations: () => apiRequest('/teleconsultations'),
  createTeleconsultation: (data) => apiRequest('/teleconsultations', { method: 'POST', body: JSON.stringify(data) }),
  updateTeleconsultationStatus: (id, status, notes) => apiRequest(`/teleconsultations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
  checkInAttendance: () => apiRequest('/attendance/check-in', { method: 'POST' }),
  checkOutAttendance: () => apiRequest('/attendance/check-out', { method: 'POST' }),
  attendance: () => apiRequest('/attendance'),
  notifications: () => apiRequest('/notifications'),
  markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
  escalateEmergency: (data) => apiRequest('/emergency/escalate', { method: 'POST', body: JSON.stringify(data) }),
  emergencyEscalations: () => apiRequest('/emergency/escalations'),
  updateEmergencyStatus: (id, status) => apiRequest(`/emergency/escalations/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getHealthRecord: (patientId) => apiRequest(`/patients/${encodeURIComponent(patientId)}/health-record`),
  createPrescription: (data) => apiRequest('/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
  prescriptions: () => apiRequest('/prescriptions'),
  createDiagnosticOrder: (data) => apiRequest('/diagnostics/orders', { method: 'POST', body: JSON.stringify(data) }),
  diagnosticOrders: () => apiRequest('/diagnostics/orders'),
  updateDiagnosticOrder: (id, data) => apiRequest(`/diagnostics/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  createFollowup: (data) => apiRequest('/followups', { method: 'POST', body: JSON.stringify(data) }),
  followups: () => apiRequest('/followups'),
  audit: () => apiRequest('/audit'),
  sync: (items) => apiRequest('/sync', { method: 'POST', body: JSON.stringify({ items }) }),
  patientDashboard: () => apiRequest('/patients/me/dashboard'),
  updateMedicineStock: (medicineId, data) => apiRequest(`/medicines/${medicineId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  doctors: (facilityId) => apiRequest(`/doctors${facilityId ? `?facility_id=${encodeURIComponent(facilityId)}` : ''}`),
  staff: (facilityId) => apiRequest(`/staff${facilityId ? `?facility_id=${encodeURIComponent(facilityId)}` : ''}`),
  updateDoctorAvailability: (userId, data) => apiRequest(`/doctors/${userId}/availability`, { method: 'PATCH', body: JSON.stringify(data) }),
  equipment: (facilityId) => apiRequest(`/equipment${facilityId ? `?facility_id=${encodeURIComponent(facilityId)}` : ''}`),
  updateEquipment: (equipmentId, data) => apiRequest(`/equipment/${equipmentId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  diagnostics: () => apiRequest('/diagnostics'),
  updateDiagnostic: (testId, data) => apiRequest(`/diagnostics/${testId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  staffAttendanceCheckIn: (data) => apiRequest('/attendance/check-in', { method: 'POST', body: JSON.stringify(data) }),
  staffAttendanceCheckOut: (data) => apiRequest('/attendance/check-out', { method: 'POST', body: JSON.stringify(data) })
};

