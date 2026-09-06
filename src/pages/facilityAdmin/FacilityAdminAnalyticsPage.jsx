import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
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

  const [facility, setFacility] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [diagnostics, setDiagnostics] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [triages, setTriages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const facId = user?.facility_id;

    Promise.allSettled([
      api.facilities(),
      api.medicines(),
      api.referrals(),
      api.diagnostics(),
      api.appointments(),
      api.consultations(),
      api.triages()
    ]).then(([facRes, medRes, refRes, diagRes, aptRes, consRes, triRes]) => {
      if (!mounted) return;

      if (facRes.status === 'fulfilled' && Array.isArray(facRes.value?.facilities)) {
        const found = facRes.value.facilities.find((f) => f.facility_id === facId);
        if (found) setFacility(found);
      }

      if (medRes.status === 'fulfilled' && Array.isArray(medRes.value?.medicines)) {
        setMedicines(medRes.value.medicines);
      }

      if (refRes.status === 'fulfilled' && Array.isArray(refRes.value?.referrals)) {
        const facRefs = refRes.value.referrals.filter(
          (r) => r.accepted_facility_id === facId || r.referring_facility_id === facId ||
                 (Array.isArray(r.target_hospitals) && r.target_hospitals.some((h) => (typeof h === 'string' ? h === facId : h?.facility_id === facId)))
        );
        setReferrals(facRefs);
      }

      if (diagRes.status === 'fulfilled' && Array.isArray(diagRes.value?.diagnostics || diagRes.value?.orders)) {
        setDiagnostics(diagRes.value.diagnostics || diagRes.value.orders || []);
      }

      if (aptRes.status === 'fulfilled' && Array.isArray(aptRes.value?.appointments)) {
        setAppointments(aptRes.value.appointments);
      }

      if (consRes.status === 'fulfilled' && Array.isArray(consRes.value?.consultations)) {
        setConsultations(consRes.value.consultations);
      }

      if (triRes.status === 'fulfilled' && Array.isArray(triRes.value?.triages)) {
        setTriages(triRes.value.triages);
      }

      setLoading(false);
    });

    return () => { mounted = false; };
  }, [user?.facility_id]);

  const totalBeds = facility?.active_beds || 0;
  const availableBeds = facility?.available_beds ?? 0;
  const occupiedBeds = Math.max(0, totalBeds - availableBeds);
  const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const icuBeds = facility?.icu_beds || 20;
  const availableIcuBeds = facility?.available_icu_beds ?? 4;
  const occupiedIcuBeds = Math.max(0, icuBeds - availableIcuBeds);
  const icuOccupancyPct = icuBeds > 0 ? Math.round((occupiedIcuBeds / icuBeds) * 100) : 0;

  const lowStockMedicines = medicines.filter((m) => m.status === 'LOW_STOCK' || m.status === 'CRITICAL' || m.status === 'OUT_OF_STOCK');
  const pendingActionReferrals = referrals.filter((r) => r.status === 'SENT' || r.status === 'PENDING');
  const completedConsultationsCount = consultations.length;
  const totalPatientsToday = appointments.length + triages.length;

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
              {t('facility')}: <strong>{facility?.name || user?.facility_name || 'District Hospital'}</strong> ({user?.facility_id || 'FAC-103'})
            </p>
          </div>
          <StatusBadge status="AVAILABLE" customLabel={t('operational_analytics')} />
        </div>
      </div>

      {/* 6 Essential Operational KPI Cards */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#1E40AF' }}>{totalPatientsToday}</div>
            <div className="stat-label">{t('totalPatientsToday')}</div>
          </div>
          <Users style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#059669' }}>{appointments.length}</div>
            <div className="stat-label">{t('opdAppointments')}</div>
          </div>
          <Calendar style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#6B21A8' }}>{completedConsultationsCount}</div>
            <div className="stat-label">{t('completedConsultations')}</div>
          </div>
          <Stethoscope style={{ color: '#6B21A8' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#D97706' }}>{pendingActionReferrals.length}</div>
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
            <StatusBadge status={occupancyPercentage > 85 ? 'CRITICAL' : 'AVAILABLE'} customLabel={`${occupancyPercentage}% OCCUPIED`} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                <span>{t('generalWardBeds')} ({occupiedBeds} / {totalBeds})</span>
                <span>{occupancyPercentage}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#E2E8F0', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, occupancyPercentage)}%`, backgroundColor: occupancyPercentage > 85 ? '#DC2626' : '#1E40AF', height: '100%', borderRadius: '7px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', fontWeight: 700, marginBottom: '0.375rem' }}>
                <span>{t('icuEmergencyBeds')} ({occupiedIcuBeds} / {icuBeds})</span>
                <span>{icuOccupancyPct}%</span>
              </div>
              <div style={{ width: '100%', backgroundColor: '#E2E8F0', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min(100, icuOccupancyPct)}%`, backgroundColor: '#D97706', height: '100%', borderRadius: '7px' }} />
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
              <strong style={{ color: '#0F2C59' }}>{triages.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span>{t('opdAppointments')}:</span>
              <strong style={{ color: '#059669' }}>{appointments.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <span>{t('interHospitalReferralsRecv')}:</span>
              <strong style={{ color: '#D97706' }}>{referrals.length}</strong>
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
                {diagnostics.length > 0 ? diagnostics.map((diag, idx) => (
                  <tr key={diag.order_id || diag.test_id || idx}>
                    <td><strong>{diag.name || diag.test_name}</strong></td>
                    <td>{diag.completed_today || (diag.status === 'COMPLETED' ? 1 : 0)}</td>
                    <td>{diag.daily_capacity || 20}</td>
                    <td><StatusBadge status={diag.status || 'AVAILABLE'} /></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#64748B' }}>No diagnostic services registered</td>
                  </tr>
                )}
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
            {lowStockMedicines.length > 0 ? (
              lowStockMedicines.map((med) => (
                <div key={med.medicine_id} style={{ padding: '0.75rem', border: '1px solid #FCA5A5', borderRadius: '8px', backgroundColor: '#FEF2F2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong style={{ color: '#991B1B', fontSize: '0.875rem' }}>{med.name}</strong>
                    <StatusBadge status={med.status} />
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#7F1D1D' }}>
                    {t('stockLabel')}: <strong>{med.current_stock} {med.unit || 'units'}</strong> ({t('minimumLabel')}: {med.min_safety_stock || 10})
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No critical medicine inventory alerts for this facility.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
