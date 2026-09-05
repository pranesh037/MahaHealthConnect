import React, { useState } from 'react';
import { Outlet, useLocation, Link, Navigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ChevronRight, Home } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const AppLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { role, isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F2C59', color: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '4px solid #D97706', borderTopColor: 'transparent', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '1.125rem', fontWeight: '600' }}>Verifying Session...</div>
          <div style={{ fontSize: '0.8125rem', color: '#94A3B8', marginTop: '0.25rem' }}>Maha Health Connect Authorization</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const routeRole = location.pathname.split('/')[1];
  const allowedRoles = {
    patient: 'patient',
    'health-worker': 'health_worker',
    doctor: 'doctor',
    'facility-admin': 'facility_admin',
    'district-authority': 'district_authority'
  };
  if (allowedRoles[routeRole] && allowedRoles[routeRole] !== role && location.pathname !== '/triage') {
    return <Navigate to="/" replace />;
  }

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter((x) => x);
    return pathnames.map((value, index) => {
      const to = `/${pathnames.slice(0, index + 1).join('/')}`;
      const isLast = index === pathnames.length - 1;
      const breadcrumbKeys = { 'health-worker': 'healthWorkerRole', patient: 'citizenPatient', doctor: 'doctorSpecialist', 'facility-admin': 'facilityAdmin', 'district-authority': 'districtHealthOfficer', maternal: 'maternalHealthcare', documents: 'documentUpload', appointments: 'appointments', referrals: 'referrals', prescriptions: 'prescriptions', followups: 'followups', diagnostics: 'diagnostics', queue: 'queue' };
      const formatted = breadcrumbKeys[value] ? t(breadcrumbKeys[value]) : value.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());

      return {
        to,
        label: formatted,
        isLast
      };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="app-container">
      <div className="main-wrapper">
        <Header toggleMobileSidebar={() => setMobileOpen(!mobileOpen)} />
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <Sidebar mobileOpen={mobileOpen} closeMobileSidebar={() => setMobileOpen(false)} />
          <main className="page-content">
            {/* Breadcrumb Navigation Trail */}
            {breadcrumbs.length > 0 && (
              <nav
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  fontSize: '0.8125rem',
                  color: '#64748B',
                  marginBottom: '1rem',
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#ffffff',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  width: 'fit-content'
                }}
                aria-label="Breadcrumb"
              >
                <Link to="/" style={{ color: '#0F2C59', display: 'flex', alignItems: 'center' }}>
                  <Home size={14} />
                </Link>
                {breadcrumbs.map((crumb, idx) => (
                  <React.Fragment key={crumb.to}>
                    <ChevronRight size={12} style={{ color: '#CBD5E1' }} />
                    {crumb.isLast ? (
                      <span style={{ fontWeight: '600', color: '#0F172A' }}>{crumb.label}</span>
                    ) : (
                      <Link to={crumb.to} style={{ color: '#475569', textDecoration: 'none' }}>
                        {crumb.label}
                      </Link>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            )}

            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
