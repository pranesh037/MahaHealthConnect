import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MOCK_REFERRALS, MOCK_FACILITIES } from '../../mockData';
import {
  GitPullRequest,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  Building2,
  BarChart3,
  XCircle
} from 'lucide-react';

export const DistrictReferralAnalyticsPage = () => {
  const { user } = useAuth();
  const { t, translateSpecialty } = useLanguage();

  const totalReferrals = MOCK_REFERRALS.length + 14;
  const pendingCount = 3;
  const acceptedCount = 12;
  const rejectedCount = 1;
  const completedCount = 10;

  const referralFlows = [
    { id: 'REF-9901', source: 'PHC Mulshi', target: 'District Hospital Aundh', specialty: 'Cardiology', priority: 'HIGH', status: 'ACCEPTED', time: '12 Mins' },
    { id: 'REF-9902', source: 'PHC Mulshi', target: 'District Hospital Aundh', specialty: 'Trauma ICU', priority: 'EMERGENCY', status: 'ACCEPTED', time: '8 Mins' },
    { id: 'REF-9903', source: 'PHC Haveli', target: 'Sub-District Hospital Baramati', specialty: 'Gynecology', priority: 'NORMAL', status: 'PENDING', time: '—' },
    { id: 'REF-9904', source: 'PHC Paud', target: 'Sassoon General Hospital', specialty: 'Neurosurgery', priority: 'EMERGENCY', status: 'ACCEPTED', time: '15 Mins' }
  ];

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
              {t('districtHealthcareOversight')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {t('districtReferralNetworkTitle')}
            </h1>
            <p style={{ color: '#CBD5E1', margin: 0, fontSize: '0.875rem' }}>
              {t('district')}: <strong>Pune District (14 Talukas)</strong> • {t('trackingInterHospital')}
            </p>
          </div>
          <StatusBadge status="AVAILABLE" customLabel={t('district_network_live')} />
        </div>
      </div>

      {/* KPI Cards Overview */}
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#1E40AF' }}>{totalReferrals}</div>
            <div className="stat-label">{t('totalReferrals')}</div>
          </div>
          <GitPullRequest style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#D97706' }}>{pendingCount}</div>
            <div className="stat-label">{t('pendingAction')}</div>
          </div>
          <Clock style={{ color: '#D97706' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#059669' }}>{acceptedCount}</div>
            <div className="stat-label">{t('acceptedRouting')}</div>
          </div>
          <CheckCircle2 style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#DC2626' }}>{rejectedCount}</div>
            <div className="stat-label">{t('rejectedRerouted')}</div>
          </div>
          <XCircle style={{ color: '#DC2626' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value" style={{ color: '#6B21A8' }}>{completedCount}</div>
            <div className="stat-label">{t('completedTransfers')}</div>
          </div>
          <BarChart3 style={{ color: '#6B21A8' }} />
        </div>
      </div>

      {/* Performance Summary Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <TrendingUp size={18} />
              <span>{t('referralNetworkEfficiency')}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.875rem' }}>
            <div style={{ padding: '0.75rem', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
              <div style={{ color: '#047857', fontWeight: 600 }}>{t('acceptanceRate')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065F46' }}>92.8%</div>
              <div style={{ fontSize: '0.75rem', color: '#059669' }}>{t('acceptanceSuccessSub')}</div>
            </div>

            <div style={{ padding: '0.75rem', backgroundColor: '#EFF6FF', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
              <div style={{ color: '#1E40AF', fontWeight: 600 }}>{t('avgResolutionTime')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1E3A8A' }}>11.4 {t('minutes')}</div>
              <div style={{ fontSize: '0.75rem', color: '#1D4ED8' }}>{t('targetEmergencySub')}</div>
            </div>
          </div>
        </div>

        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Building2 size={18} />
              <span>{t('topFacilityNodes')}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.875rem' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{t('topReferringFacilities')}</div>
              <div style={{ color: '#475569', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                1. PHC Mulshi (6) • 2. PHC Haveli (4) • 3. PHC Paud (3)
              </div>
            </div>

            <div style={{ paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0' }}>
              <div style={{ fontWeight: 700, color: '#0F172A' }}>{t('topReceivingFacilities')}</div>
              <div style={{ color: '#475569', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                1. District Hospital Aundh (10) • 2. Sassoon General Hospital (5)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Flow Visual Table */}
      <div className="gov-card">
        <div className="gov-card-header">
          <div className="gov-card-title">
            <GitPullRequest size={18} />
            <span>{t('activeReferralMatrix')}</span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="gov-table">
            <thead>
              <tr>
                <th>{t('referralId')}</th>
                <th>{t('sourceFacility')}</th>
                <th>{t('transferPath')}</th>
                <th>{t('targetFacility')}</th>
                <th>{t('requiredSpecialty')}</th>
                <th>{t('priority')}</th>
                <th>{t('responseTime')}</th>
                <th>{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {referralFlows.map((flow) => (
                <tr key={flow.id}>
                  <td><strong style={{ fontFamily: 'monospace' }}>{flow.id}</strong></td>
                  <td>{flow.source}</td>
                  <td style={{ textAlign: 'center' }}><ArrowRight size={16} style={{ color: '#1E40AF' }} /></td>
                  <td><strong>{flow.target}</strong></td>
                  <td>{translateSpecialty(flow.specialty)}</td>
                  <td><StatusBadge status={flow.priority} /></td>
                  <td>{flow.time}</td>
                  <td><StatusBadge status={flow.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
