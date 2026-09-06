import React from 'react';
import { GitPullRequest, CheckCircle2, Clock, XCircle, BarChart3, ArrowRight, TrendingUp, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../services/api';
import { StatusBadge } from '../../components/common/StatusBadge';

export const DistrictReferralAnalyticsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { t, translateSpecialty } = useLanguage();
  const [analytics, setAnalytics] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const buildAnalytics = (referrals) => {
    const records = Array.isArray(referrals) ? referrals : [];
    const targetName = (referral) => {
      const firstTarget = Array.isArray(referral.target_hospitals) ? referral.target_hospitals[0] : null;
      return referral.target_facility_name || referral.destination_facility_name || referral.accepted_facility_name || referral.target_facility_id || referral.destination_facility_id || referral.accepted_facility_id || firstTarget?.name || firstTarget?.facility || firstTarget?.facility_id;
    };
    const countBy = (getKey) => Object.entries(records.reduce((counts, referral) => {
      const key = getKey(referral);
      if (key) counts[key] = (counts[key] || 0) + 1;
      return counts;
    }, {})).sort(([, left], [, right]) => right - left).slice(0, 3)
      .map(([name, count]) => ({ name, count }));
    const statusOf = (referral) => String(referral.status || '').toUpperCase();
    const decisions = records.map((referral) => {
      const completedAt = referral.accepted_at || referral.rejected_at;
      const minutes = completedAt && referral.created_at ? (new Date(completedAt) - new Date(referral.created_at)) / 60000 : null;
      return Number.isFinite(minutes) && minutes >= 0 ? minutes : null;
    }).filter((minutes) => minutes !== null);
    const accepted = records.filter((referral) => statusOf(referral) === 'ACCEPTED').length;
    return {
      district: { display_name: `${user?.district || user?.jurisdiction || 'District'}`.replace(/\s+District$/i, '') + ' District' },
      referrals: records,
      metrics: {
        total: records.length,
        pending_action: records.filter((referral) => ['PENDING', 'SENT'].includes(statusOf(referral))).length,
        accepted_routing: accepted,
        rejected_rerouted: records.filter((referral) => statusOf(referral) === 'REJECTED').length,
        completed_transfers: records.filter((referral) => statusOf(referral) === 'COMPLETED').length,
        acceptance_rate: records.length ? (accepted / records.length) * 100 : null,
        average_resolution_minutes: decisions.length ? decisions.reduce((total, minutes) => total + minutes, 0) / decisions.length : null
      },
      top_referring_facilities: countBy((referral) => referral.referring_facility_name || referral.referring_facility_id),
      top_receiving_facilities: countBy(targetName)
    };
  };

  React.useEffect(() => {
    if (authLoading || !user?.user_id) return undefined;
    let cancelled = false;
    const loadAnalytics = async () => {
      setLoading(true); setError(null);
      try {
        const result = await api.referrals();
        if (!cancelled) setAnalytics(buildAnalytics(result?.referrals));
      } catch (requestError) {
        if (!cancelled) { setAnalytics(null); setError(requestError); }
      } finally { if (!cancelled) setLoading(false); }
    };
    loadAnalytics();
    return () => { cancelled = true; };
  }, [authLoading, user?.user_id, user?.district, user?.jurisdiction]);

  const metrics = analytics?.metrics;
  const cards = metrics ? [[metrics.total, t('totalReferrals'), GitPullRequest], [metrics.pending_action, t('pendingAction'), Clock], [metrics.accepted_routing, t('acceptedRouting'), CheckCircle2], [metrics.rejected_rerouted, t('rejectedRerouted'), XCircle], [metrics.completed_transfers, t('completedTransfers'), BarChart3]] : [];
  const minutes = metrics?.average_resolution_minutes;
  return <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
    <div className="gov-card" style={{ background: 'linear-gradient(135deg, #0F2C59, #1E3A8A)', color: '#fff', marginBottom: '1.5rem' }}><div style={{ color: '#F59E0B', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>{t('districtHealthcareOversight')}</div><h1 style={{ margin: '0.3rem 0', fontSize: '1.5rem' }}>{t('districtReferralNetworkTitle')}</h1><p style={{ color: '#CBD5E1', margin: 0 }}>{analytics?.district?.display_name || 'District'} • {t('trackingInterHospital')}</p></div>
    {loading && <div className="gov-card">Loading referral analytics...</div>}
    {error && <div className="gov-card" role="alert" style={{ color: '#B91C1C' }}>Unable to load referral analytics</div>}
    {!loading && !error && analytics && <>
      <div className="grid-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', marginBottom: '1.5rem' }}>{cards.map(([value, label, Icon]) => <div className="stat-card" key={label}><div><div className="stat-value">{value}</div><div className="stat-label">{label}</div></div><Icon /></div>)}</div>
      {metrics.total === 0 ? <div className="gov-card">No referral data available</div> : <>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div className="gov-card"><div className="gov-card-header"><div className="gov-card-title"><TrendingUp size={18} /><span>{t('referralNetworkEfficiency')}</span></div></div><div><strong>{t('acceptanceRate')}:</strong> {metrics.acceptance_rate === null ? 'Data not available' : `${metrics.acceptance_rate.toFixed(1)}%`}<br /><strong>{t('avgResolutionTime')}:</strong> {minutes === null ? 'Data not available' : `${minutes.toFixed(1)} ${t('minutes')}`}</div></div>
          <div className="gov-card"><div className="gov-card-header"><div className="gov-card-title"><Building2 size={18} /><span>{t('topFacilityNodes')}</span></div></div><div><strong>{t('topReferringFacilities')}</strong><div>{analytics.top_referring_facilities.map((facility) => `${facility.name} (${facility.count})`).join(' • ') || 'Data not available'}</div><strong style={{ display: 'block', marginTop: '0.8rem' }}>{t('topReceivingFacilities')}</strong><div>{analytics.top_receiving_facilities.map((facility) => `${facility.name} (${facility.count})`).join(' • ') || 'Data not available'}</div></div></div>
        </div>
        <div className="gov-card"><div className="gov-card-header"><div className="gov-card-title"><GitPullRequest size={18} /><span>{t('activeReferralMatrix')}</span></div></div><div style={{ overflowX: 'auto' }}><table className="gov-table"><thead><tr><th>{t('referralId')}</th><th>{t('sourceFacility')}</th><th>{t('transferPath')}</th><th>{t('targetFacility')}</th><th>{t('requiredSpecialty')}</th><th>{t('priority')}</th><th>{t('status')}</th></tr></thead><tbody>{analytics.referrals.map((referral) => { const firstTarget = Array.isArray(referral.target_hospitals) ? referral.target_hospitals[0] : null; const target = referral.target_facility_name || referral.destination_facility_name || referral.accepted_facility_name || referral.target_facility_id || referral.destination_facility_id || referral.accepted_facility_id || firstTarget?.name || firstTarget?.facility || firstTarget?.facility_id || '—'; return <tr key={referral.referral_id}><td>{referral.referral_id}</td><td>{referral.referring_facility_name || referral.referring_facility_id}</td><td><ArrowRight size={16} /></td><td>{target}</td><td>{translateSpecialty(referral.specialty_required)}</td><td><StatusBadge status={referral.priority} /></td><td><StatusBadge status={referral.status} /></td></tr>; })}</tbody></table></div></div>
      </>}
    </>}
  </div>;
};
