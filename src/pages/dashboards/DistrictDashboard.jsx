import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import { MOCK_FACILITIES } from '../../mockData';
import { Building2, GitPullRequest, ShieldCheck, UserCheck, AlertTriangle, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DistrictDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [facilities, setFacilities] = useState([]);
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchDistrictData = async () => {
      try {
        const [facRes, refRes] = await Promise.allSettled([
          api.facilities(),
          api.referrals()
        ]);
        if (!isMounted) return;
        setFacilities(facRes.status === 'fulfilled' && Array.isArray(facRes.value?.facilities) ? facRes.value.facilities : MOCK_FACILITIES);
        setReferrals(refRes.status === 'fulfilled' && Array.isArray(refRes.value?.referrals) ? refRes.value.referrals : []);
      } catch (err) {
        console.warn('Failed to load district dashboard data:', err);
      }
    };
    fetchDistrictData();
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
              {t('districtOversight')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>
              {user?.name || 'District Health Officer'} (DHO)
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
              {t('districtJurisdiction')}: <strong>{user?.district || 'Pune'} District</strong> • {facilities.length || 34} Healthcare Facilities
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/district-authority/referral-analytics" className="gov-btn gov-btn-saffron">
              <GitPullRequest size={18} />
              <span>{t('referralAnalytics')}</span>
            </Link>
            <Link to="/district-authority/audit-logs" className="gov-btn gov-btn-secondary">
              <ShieldCheck size={18} />
              <span>{t('securityAuditLogs')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Stats Overview */}
      <div className="grid-stats">
        <div className="stat-card">
          <div>
            <div className="stat-value">{facilities.length || 34}</div>
            <div className="stat-label">{t('facilitiesLabel')}</div>
          </div>
          <Building2 style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{facilities.length || 33} / {facilities.length || 34}</div>
            <div className="stat-label">{t('facilitiesConnected')}</div>
          </div>
          <UserCheck style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{referrals.length}</div>
            <div className="stat-label">{t('totalReferrals')}</div>
          </div>
          <GitPullRequest style={{ color: '#D97706' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">0</div>
            <div className="stat-label">{t('stockAlerts')}</div>
          </div>
          <AlertTriangle style={{ color: '#DC2626' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* District Facility Status Overview */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Building2 size={20} />
              <span>{t('facilityCapacityResponse')}</span>
            </div>
            <Link to="/district-authority/facilities" style={{ fontSize: '0.8125rem', color: '#1E40AF', fontWeight: '600' }}>
              {t('viewAllFacilities')}
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {facilities.slice(0, 5).map((fac) => (
              <div key={fac.facility_id || fac._id} style={{ padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0F2C59' }}>{fac.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {t('district')}: {fac.district || user?.district || 'Pune'} • {t('type')}: {fac.type || 'PHC'}
                    </div>
                  </div>
                  <StatusBadge status={fac.status || 'AVAILABLE'} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* District Analytics Summary */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <BarChart2 size={20} />
              <span>{t('districtPerformanceMetrics')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: '700', color: '#0F172A' }}>{t('referralResolutionTime')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#059669', marginTop: '0.25rem' }}>
                14.2 {t('minutes')} {t('avgResponse')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {t('targetEmergency')}
              </div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: '700', color: '#0F172A' }}>{t('ancCompletionRate')}</div>
              <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1E40AF', marginTop: '0.25rem' }}>
                91.4% {t('coverage')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

