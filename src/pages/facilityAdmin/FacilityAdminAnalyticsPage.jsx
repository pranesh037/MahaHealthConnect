import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MOCK_FACILITIES, MOCK_MEDICINES, MOCK_DIAGNOSTICS, MOCK_REFERRALS } from '../../mockData';
import {
  Users,
  Calendar,
  Stethoscope,
  GitPullRequest,
  Building2,
  AlertTriangle,
  Activity,
  TrendingUp,
  Pill
} from 'lucide-react';

export const FacilityAdminAnalyticsPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const facility = MOCK_FACILITIES.find((f) => f.facility_id === user?.facility_id) || MOCK_FACILITIES[2];
  const totalBeds = facility.active_beds || 350;
  const occupiedBeds = Math.round(totalBeds * 0.8);
  const availableBeds = totalBeds - occupiedBeds;

  const lowStockMedicines = MOCK_MEDICINES.filter((m) => m.status === 'LOW' || m.status === 'CRITICAL');
  const pendingReferrals = MOCK_REFERRALS.filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED');

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Page Header */}
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
            <div style={{ color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              {t('hospitalOpsAnalytics')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {t('opsAnalyticsTitle')}
            </h1>
            <p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>
              {t('facility')}: <strong>{facility.name}</strong>
            </p>
          </div>
          <StatusBadge status="AVAILABLE" customLabel={t('operational_analytics')} />
        </div>
      </div>

      {/* 6 Essential Operational KPI Cards */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#1E40AF' }}>48</div>
            <div className="stat-label">{t('totalPatientsToday')}</div>
          </div>
          <Users style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#059669' }}>14</div>
            <div className="stat-label">{t('opdAppointments')}</div>
          </div>
          <Calendar style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#6B21A8' }}>10</div>
            <div className="stat-label">{t('completedConsultations')}</div>
          </div>
          <Stethoscope style={{ color: '#6B21A8' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#D97706' }}>{pendingReferrals.length}</div>
            <div className="stat-label">{t('pendingAction')} {t('referralsLabel')}</div>
          </div>
          <GitPullRequest style={{ color: '#D97706' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#047857' }}>{availableBeds} / {totalBeds}</div>
            <div className="stat-label">{t('availableBeds')}</div>
          </div>
          <Building2 style={{ color: '#047857' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#DC2626' }}>{lowStockMedicines.length}</div>
            <div className="stat-label">{t('medicineAlerts')}</div>
          </div>
          <AlertTriangle style={{ color: '#DC2626' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Bed Utilization Bar & Capacity Breakdown */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Building2 size={18} />
              <span>{t('bedUtilizationTitle')}</span>
            </div>
            <StatusBadge status="AVAILABLE" customLabel="80% OCCUPIED" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                <span>{t('generalWardBeds')} ({occupiedBeds})</span>
                <span>80%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#E2E8F0', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{ width: '80%', backgroundColor: '#1E40AF', height: '100%', borderRadius: '7px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                <span>{t('icuEmergencyBeds')} (18 / 20)</span>
                <span>90%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#E2E8F0', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{ width: '90%', backgroundColor: '#D97706', height: '100%', borderRadius: '7px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                <span>{t('maternalNeonatalBeds')} (25 / 30)</span>
                <span>83%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#E2E8F0', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{ width: '83%', backgroundColor: '#059669', height: '100%', borderRadius: '7px' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Patient Flow & Consultation Throughput */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <TrendingUp size={18} />
              <span>{t('todaysPatientFlow')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span>{t('opdTriageRegs')}:</span>
              <strong style={{ color: '#0F2C59' }}>32</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span>{t('emergencyTraumaArrivals')}:</span>
              <strong style={{ color: '#DC2626' }}>6</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span>{t('interHospitalReferralsRecv')}:</span>
              <strong style={{ color: '#D97706' }}>10</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
              <span>{t('avgConsultationWait')}:</span>
              <strong style={{ color: '#059669' }}>18 {t('minutes')}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic Utilization & Medicine Stock Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
        {/* Diagnostic Utilization Matrix */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Activity size={18} />
              <span>{t('diagnosticUtilizationMatrix')}</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="gov-table">
              <thead>
                <tr>
                  <th>{t('diagnosticService')}</th>
                  <th>{t('completedLabel')}</th>
                  <th>{t('dailyCap')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DIAGNOSTICS.map((diag) => (
                  <tr key={diag.test_id}>
                    <td><strong>{diag.name}</strong></td>
                    <td>{diag.completed_today}</td>
                    <td>{diag.daily_capacity}</td>
                    <td><StatusBadge status={diag.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Medicine Inventory Threshold Alerts */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Pill size={18} />
              <span>{t('medicineAlertsTitle')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {lowStockMedicines.map((med) => (
              <div key={med.medicine_id} style={{ padding: '0.75rem', border: '1px solid #FCA5A5', borderRadius: '8px', backgroundColor: '#FEF2F2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <strong style={{ color: '#991B1B', fontSize: '0.875rem' }}>{med.name}</strong>
                  <StatusBadge status={med.status} />
                </div>
                <div style={{ fontSize: '0.8125rem', color: '#7F1D1D' }}>
                  {t('stockLabel')}: <strong>{med.current_stock} {med.unit}</strong> ({t('minimumLabel')}: {med.min_safety_stock})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
