import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { OfflineProvider } from './context/OfflineContext';
import { PatientProvider } from './context/PatientContext';
import { AuditProvider } from './context/AuditContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';

import { PatientDashboard } from './pages/dashboards/PatientDashboard';
import { HealthWorkerDashboard } from './pages/dashboards/HealthWorkerDashboard';
import { DoctorDashboard } from './pages/dashboards/DoctorDashboard';
import { FacilityAdminDashboard } from './pages/dashboards/FacilityAdminDashboard';
import { DistrictDashboard } from './pages/dashboards/DistrictDashboard';

import { CriticalWorkflowPage } from './pages/CriticalWorkflowPage';
import { SupportingWorkflowPage } from './pages/SupportingWorkflowPage';

import { PatientRegistration } from './pages/healthWorker/PatientRegistration';
import { PatientSearch } from './pages/healthWorker/PatientSearch';
import { DigitalTriage } from './pages/healthWorker/DigitalTriage';

import { PatientProfilePage } from './pages/patient/PatientProfilePage';
import { PatientMaternalPage } from './pages/patient/PatientMaternalPage';
import { PatientNfcPage } from './pages/patient/PatientNfcPage';
import { PatientHealthRecord } from './pages/patient/PatientHealthRecord';
import { PatientAppointmentsServices } from './pages/patient/PatientAppointmentsServices';
import { PatientReferralsCare } from './pages/patient/PatientReferralsCare';

import { HealthWorkerDocumentsPage } from './pages/healthWorker/HealthWorkerDocumentsPage';
import { HealthWorkerMaternalPage } from './pages/healthWorker/HealthWorkerMaternalPage';
import { HealthWorkerPatients } from './pages/healthWorker/HealthWorkerPatients';
import { HealthWorkerTriageCare } from './pages/healthWorker/HealthWorkerTriageCare';

import { DoctorPatientCare } from './pages/doctor/DoctorPatientCare';

import { FacilityAdminAttendancePage } from './pages/facilityAdmin/FacilityAdminAttendancePage';
import { FacilityAdminAnalyticsPage } from './pages/facilityAdmin/FacilityAdminAnalyticsPage';
import { FacilityAdminResources } from './pages/facilityAdmin/FacilityAdminResources';

import { DistrictReferralAnalyticsPage } from './pages/district/DistrictReferralAnalyticsPage';
import { DistrictMedicineStocksPage } from './pages/district/DistrictMedicineStocksPage';
import { DistrictDiagnosticCapacityPage } from './pages/district/DistrictDiagnosticCapacityPage';
import { DistrictSpecialistDistributionPage } from './pages/district/DistrictSpecialistDistributionPage';
import { DistrictNetwork } from './pages/district/DistrictNetwork';
import { DistrictReportsAudit } from './pages/district/DistrictReportsAudit';

const RoleBasedRedirect = () => {
  const { role, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  switch (role) {
    case 'patient': return <Navigate to="/patient" replace />;
    case 'health_worker': return <Navigate to="/health-worker" replace />;
    case 'doctor': return <Navigate to="/doctor" replace />;
    case 'facility_admin': return <Navigate to="/facility-admin" replace />;
    case 'district_authority': return <Navigate to="/district-authority" replace />;
    default: return <Navigate to="/login" replace />;
  }
};

export function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <OfflineProvider>
          <PatientProvider>
            <AuditProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />

                  {/* Main Application Layout Wrapper */}
                  <Route element={<AppLayout />}>
                    <Route path="/" element={<RoleBasedRedirect />} />
                    <Route path="/triage" element={<DigitalTriage />} />

                    {/* Patient / Citizen Routes */}
                    <Route path="/patient" element={<PatientDashboard />} />
                    <Route path="/patient/health-record" element={<PatientHealthRecord />} />
                    <Route path="/patient/appointments" element={<PatientAppointmentsServices />} />
                    <Route path="/patient/referrals" element={<PatientReferralsCare />} />
                    <Route path="/patient/profile" element={<PatientProfilePage />} />
                    <Route path="/patient/prescriptions" element={<CriticalWorkflowPage overrideKey="prescription" />} />
                    <Route path="/patient/followups" element={<CriticalWorkflowPage overrideKey="followups" />} />
                    <Route path="/patient/maternal" element={<PatientMaternalPage />} />
                    <Route path="/patient/services" element={<CriticalWorkflowPage overrideKey="services" />} />
                    <Route path="/patient/nfc" element={<PatientNfcPage />} />

                    {/* Health Worker Routes */}
                    <Route path="/health-worker" element={<HealthWorkerDashboard />} />
                    <Route path="/health-worker/patients" element={<HealthWorkerPatients />} />
                    <Route path="/health-worker/register" element={<PatientRegistration />} />
                    <Route path="/health-worker/triage" element={<HealthWorkerTriageCare />} />
                    <Route path="/health-worker/appointments" element={<CriticalWorkflowPage overrideKey="appointments" />} />
                    <Route path="/health-worker/referrals" element={<CriticalWorkflowPage overrideKey="referrals" />} />
                    <Route path="/health-worker/documents" element={<HealthWorkerDocumentsPage />} />
                    <Route path="/health-worker/followups" element={<CriticalWorkflowPage overrideKey="followups" />} />
                    <Route path="/health-worker/maternal" element={<HealthWorkerMaternalPage />} />
                    <Route path="/health-worker/sync" element={<CriticalWorkflowPage overrideKey="sync" />} />

                    {/* Doctor / Specialist Routes */}
                    <Route path="/doctor" element={<DoctorDashboard />} />
                    <Route path="/doctor/queue" element={<CriticalWorkflowPage overrideKey="queue" />} />
                    <Route path="/doctor/patient-care" element={<DoctorPatientCare />} />
                    <Route path="/doctor/patients" element={<CriticalWorkflowPage overrideKey="patients" />} />
                    <Route path="/doctor/history" element={<CriticalWorkflowPage overrideKey="history" />} />
                    <Route path="/doctor/diagnostics" element={<CriticalWorkflowPage overrideKey="diagnostics" />} />
                    <Route path="/doctor/prescription" element={<CriticalWorkflowPage overrideKey="prescription" />} />
                    <Route path="/doctor/referrals" element={<CriticalWorkflowPage overrideKey="referrals" />} />
                    <Route path="/doctor/followups" element={<CriticalWorkflowPage overrideKey="followups" />} />

                    {/* Facility Administrator Routes */}
                    <Route path="/facility-admin" element={<FacilityAdminDashboard />} />
                    <Route path="/facility-admin/resources" element={<FacilityAdminResources />} />
                    <Route path="/facility-admin/attendance" element={<FacilityAdminAttendancePage />} />
                    <Route path="/facility-admin/doctors" element={<CriticalWorkflowPage overrideKey="doctors" />} />
                    <Route path="/facility-admin/medicines" element={<CriticalWorkflowPage overrideKey="medicines" />} />
                    <Route path="/facility-admin/diagnostics" element={<CriticalWorkflowPage overrideKey="diagnostics" />} />
                    <Route path="/facility-admin/referrals" element={<CriticalWorkflowPage overrideKey="referrals" />} />
                    <Route path="/facility-admin/analytics" element={<FacilityAdminAnalyticsPage />} />
                    <Route path="/facility-admin/staff" element={<FacilityAdminAttendancePage />} />

                    {/* District Authority Routes */}
                    <Route path="/district-authority" element={<DistrictDashboard />} />
                    <Route path="/district-authority/network" element={<DistrictNetwork />} />
                    <Route path="/district-authority/facilities" element={<CriticalWorkflowPage overrideKey="facilities" />} />
                    <Route path="/district-authority/referral-analytics" element={<DistrictReferralAnalyticsPage />} />
                    <Route path="/district-authority/medicine-analytics" element={<DistrictMedicineStocksPage />} />
                    <Route path="/district-authority/diagnostic-analytics" element={<DistrictDiagnosticCapacityPage />} />
                    <Route path="/district-authority/specialists" element={<DistrictSpecialistDistributionPage />} />
                    <Route path="/district-authority/reports" element={<DistrictReportsAudit />} />
                    <Route path="/district-authority/quality" element={<SupportingWorkflowPage overrideKey="quality" />} />
                    <Route path="/district-authority/audit-logs" element={<CriticalWorkflowPage overrideKey="audit-logs" />} />

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </AuditProvider>
          </PatientProvider>
        </OfflineProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
