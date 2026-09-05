import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import { Building2, Pill, Activity, UserCheck, GitPullRequest, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacilityAdminDashboard = () => {
  const { user } = useAuth();
  const { t, translateSpecialty, translateDiagnostic } = useLanguage();

  const [referrals, setReferrals] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchAdminData = async () => {
      try {
        const [refsRes, medRes] = await Promise.allSettled([
          api.referrals(),
          api.medicines()
        ]);
        if (!isMounted) return;
        setReferrals(refsRes.status === 'fulfilled' && Array.isArray(refsRes.value?.referrals) ? refsRes.value.referrals : []);
        setMedicines(medRes.status === 'fulfilled' && Array.isArray(medRes.value?.medicines) ? medRes.value.medicines : []);
      } catch (err) {
        console.warn('Failed to load facility admin dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchAdminData();
    return () => { isMounted = false; };
  }, [user]);

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
              {user?.name || 'Facility Administrator'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
              {t('facility')}: <strong>{user?.facility_name || 'PHC / Hospital Facility'}</strong> • {t('district')}: {user?.district || 'Pune'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/facility-admin/referrals" className="gov-btn gov-btn-saffron">
              <GitPullRequest size={18} />
              <span>{t('referralInbox')} ({referrals.length})</span>
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
            <div className="stat-value">Operational</div>
            <div className="stat-label">{t('doctorAvailability')}</div>
          </div>
          <UserCheck style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{medicines.filter(m => m.status === 'LOW_STOCK' || m.status === 'CRITICAL').length}</div>
            <div className="stat-label">{t('medicineAlerts')}</div>
          </div>
          <AlertTriangle style={{ color: '#DC2626' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">Active</div>
            <div className="stat-label">{t('beds')}</div>
          </div>
          <Building2 style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{referrals.length}</div>
            <div className="stat-label">{t('referralInbox')}</div>
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
            {referrals.length > 0 ? (
              referrals.map((ref) => (
                <div key={ref.referral_id || ref._id} style={{ padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0F2C59' }}>
                      {ref.patient_name} ({translateSpecialty(ref.specialty_required)})
                    </div>
                    <StatusBadge status={ref.status || 'SENT'} />
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '0.5rem' }}>
                    {t('referredFrom')}: <strong>{ref.referring_facility_name || 'PHC'}</strong> • {t('clinicalNote')}: {ref.clinical_notes || 'N/A'}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No incoming referrals in queue for this facility.
              </div>
            )}
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
            {medicines.length > 0 ? (
              medicines.slice(0, 5).map((med) => (
                <div key={med.medicine_id || med._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0F172A' }}>{med.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {t('stockLabel')}: {med.current_stock} {med.unit || 'units'}
                    </div>
                  </div>
                  <StatusBadge status={med.status || 'AVAILABLE'} />
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No medicine inventory alerts on record.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

