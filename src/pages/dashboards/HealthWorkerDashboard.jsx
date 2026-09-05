import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useOffline } from '../../context/OfflineContext';
import { usePatients } from '../../context/PatientContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import {
  Users,
  Activity,
  GitPullRequest,
  Clock,
  Wifi,
  PlusCircle,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const HealthWorkerDashboard = () => {
  const { user } = useAuth();
  const { t, translateSpecialty } = useLanguage();
  const { isOnline, pendingSyncCount, triggerSync, isSyncing } = useOffline();
  const { patients } = usePatients();

  const [referrals, setReferrals] = useState([]);
  const [triages, setTriages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchWorkerData = async () => {
      try {
        const [refsRes, trgRes] = await Promise.allSettled([
          api.referrals(),
          api.triages()
        ]);
        if (!isMounted) return;
        setReferrals(refsRes.status === 'fulfilled' && Array.isArray(refsRes.value?.referrals) ? refsRes.value.referrals : []);
        setTriages(trgRes.status === 'fulfilled' && Array.isArray(trgRes.value?.triages) ? trgRes.value.triages : []);
      } catch (err) {
        console.warn('Failed to load health worker dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchWorkerData();
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
              {t('field_health_worker_portal')} • {t('asha_anm_coord')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>
              {t('greeting_good_morning')}, {user?.name || 'Health Worker'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
              {t('facility')}: <strong>{user?.facility_name || 'PHC Facility'}</strong> • {t('district')}: {user?.district || 'Pune'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/health-worker/register" className="gov-btn gov-btn-saffron">
              <PlusCircle size={18} />
              <span>{t('registerPatientAction')}</span>
            </Link>
            <Link to="/health-worker/triage" className="gov-btn gov-btn-secondary">
              <Activity size={18} />
              <span>{t('digitalTriageAction')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid-stats">
        <div className="stat-card">
          <div>
            <div className="stat-value">{patients.length}</div>
            <div className="stat-label">{t('registeredPatients')}</div>
          </div>
          <Users style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{triages.length}</div>
            <div className="stat-label">{t('pendingDigitalTriage')}</div>
          </div>
          <Activity style={{ color: '#D97706' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{referrals.length}</div>
            <div className="stat-label">{t('activeReferralsSent')}</div>
          </div>
          <GitPullRequest style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">0</div>
            <div className="stat-label">{t('followupsDueWeek')}</div>
          </div>
          <Clock style={{ color: '#6B21A8' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Offline Sync Status Panel */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Wifi size={20} />
              <span>{t('offlineSyncStatus')}</span>
            </div>
            <StatusBadge status={isOnline ? 'ONLINE' : 'OFFLINE'} />
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: '700', color: '#0F172A' }}>
                    {pendingSyncCount > 0 ? `${pendingSyncCount} ${t('pending_sync')}` : t('allLocalDataSynced')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.25rem' }}>
                    {isOnline ? t('connectedGovtCloud') : t('workingOfflineStorage')}
                  </div>
                </div>

                <button
                  onClick={triggerSync}
                  disabled={pendingSyncCount === 0 || isSyncing}
                  className="gov-btn gov-btn-primary gov-btn-sm"
                >
                  {isSyncing ? t('syncing') : t('sync_now')}
                </button>
              </div>
            </div>

            <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
              <strong>Active Worker Session:</strong> {user?.user_id || 'HW-ONLINE'} • {user?.facility_name || 'PHC'}
            </div>
          </div>
        </div>

        {/* Priority Triage Patients Queue */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Activity size={20} />
              <span>{t('registeredPatientQueue')}</span>
            </div>
            <Link to="/health-worker/patients" style={{ fontSize: '0.8125rem', color: '#1E40AF', fontWeight: '600' }}>
              {t('viewAll')}
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {patients.length > 0 ? (
              patients.slice(0, 4).map((pt) => (
                <div
                  key={pt.patient_id || pt._id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.625rem 0.75rem',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0F2C59' }}>
                      {pt.name} ({pt.age || '30'} {t('yearsShort')})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {t('identifier')}: {pt.patient_id} • {t('village')}: {pt.village || 'General'}
                    </div>
                  </div>

                  <StatusBadge status={pt.triage_status || 'ROUTINE'} />
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No patients registered under this facility yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Referral Requests */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <GitPullRequest size={20} />
              <span>{t('referralSent')}</span>
            </div>
            <Link to="/health-worker/referrals" style={{ fontSize: '0.8125rem', color: '#1E40AF', fontWeight: '600' }}>
              {t('newReferral')}
            </Link>
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
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                    {t('targetHospital')}: <strong>{ref.accepted_facility_name || ref.accepted_hospital || 'Matching...'}</strong>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No referrals sent yet.
              </div>
            )}
          </div>
        </div>

        {/* Facility Service Status */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Building2 size={20} />
              <span>{user?.facility_name || 'PHC Facility'} {t('facilityStatus')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0' }}>
              <span>{t('doctorsOnDuty')}:</span>
              <strong>Active Facility</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.375rem 0', borderTop: '1px solid #E2E8F0' }}>
              <span>{t('emergencyAmbulance')}:</span>
              <StatusBadge status="AVAILABLE" customLabel={t('ready247')} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

