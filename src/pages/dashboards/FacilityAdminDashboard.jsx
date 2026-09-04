import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MOCK_MEDICINES, MOCK_DIAGNOSTICS, MOCK_REFERRALS } from '../../mockData';
import { Building2, Pill, Activity, UserCheck, GitPullRequest, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacilityAdminDashboard = () => {
  const { user } = useAuth();
  const { t, translateSpecialty, translateDiagnostic } = useLanguage();

  return (
    <div>
      {/* Welcome Banner */}
      <div
        className="gov-card"
        style={{
          backgroundColor: '#0F2C59',
          color: '#ffffff',
          marginBottom: '1.5rem',
          backgroundImage: 'linear-gradient(135deg, #0F2C59 0%, #1E3A8A 100%)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8125rem', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase' }}>
              {t('hospitalAdminHeader')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>
              {user?.name || 'Rajesh Pawar'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
              {t('facility')}: <strong>{user?.facility_name || 'District Hospital Aundh'}</strong> • {t('activeBeds')}: 350 (280 {t('occupied')})
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/facility-admin/referrals" className="gov-btn gov-btn-saffron">
              <GitPullRequest size={18} />
              <span>{t('referralInbox')} (2)</span>
            </Link>
            <Link to="/facility-admin/medicines" className="gov-btn gov-btn-secondary">
              <Pill size={18} />
              <span>{t('medicineStock')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid-stats">
        <div className="stat-card">
          <div>
            <div className="stat-value">45 / 48</div>
            <div className="stat-label">{t('doctorAvailability')}</div>
          </div>
          <UserCheck style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">2</div>
            <div className="stat-label">{t('medicineAlerts')}</div>
          </div>
          <AlertTriangle style={{ color: '#DC2626' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">80%</div>
            <div className="stat-label">{t('beds')}</div>
          </div>
          <Building2 style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">65 / 115</div>
            <div className="stat-label">{t('diagnosticCapacity')}</div>
          </div>
          <Activity style={{ color: '#D97706' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Incoming Referral Coordination Panel */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <GitPullRequest size={20} />
              <span>{t('referralInbox')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {MOCK_REFERRALS.map((ref) => (
              <div key={ref.referral_id} style={{ padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0F2C59' }}>
                    {ref.patient_name} ({translateSpecialty(ref.specialty_required)})
                  </div>
                  <StatusBadge status={ref.status} />
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '0.5rem' }}>
                  {t('referredFrom')}: <strong>{ref.referring_facility_name}</strong> • {t('clinicalNote')}: {ref.clinical_notes}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button className="gov-btn gov-btn-primary gov-btn-sm" disabled>
                    ✓ {t('accepted')} ({t('facilityCapacity')})
                  </button>
                  <button className="gov-btn gov-btn-secondary gov-btn-sm">
                    {t('rejectedRerouted')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Medicine Inventory Threshold Alerts */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Pill size={20} />
              <span>{t('medicineAlertsTitle')}</span>
            </div>
            <Link to="/facility-admin/medicines" style={{ fontSize: '0.8125rem', color: '#1E40AF', fontWeight: '600' }}>
              {t('viewAll')}
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {MOCK_MEDICINES.map((med) => (
              <div key={med.medicine_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0F172A' }}>{med.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                    {t('stockLabel')}: {med.current_stock} {med.unit} ({t('minimumLabel')}: {med.min_safety_stock})
                  </div>
                </div>
                <StatusBadge status={med.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Diagnostic Lab Capacities */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Activity size={20} />
              <span>{t('diagnosticLabCapacities')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {MOCK_DIAGNOSTICS.map((diag) => (
              <div key={diag.test_id} style={{ padding: '0.625rem', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0F2C59' }}>{translateDiagnostic(diag.name)}</span>
                  <StatusBadge status={diag.status} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                  {t('capacityLabel')}: {diag.completed_today} / {diag.daily_capacity} {t('completedLabel')} ({diag.remaining_capacity} {t('remainingToday')})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
