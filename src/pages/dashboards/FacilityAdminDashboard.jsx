import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import { Building2, Pill, Activity, UserCheck, GitPullRequest, AlertTriangle, CheckCircle2, XCircle, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FacilityAdminDashboard = () => {
  const { user } = useAuth();
  const { t, translateSpecialty, translatePriority } = useLanguage();

  const [referrals, setReferrals] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [facility, setFacility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [refsRes, medRes, docsRes, facsRes] = await Promise.allSettled([
        api.referrals(),
        api.medicines(),
        api.doctors(user?.facility_id),
        api.facilities()
      ]);

      if (facsRes.status === 'fulfilled' && Array.isArray(facsRes.value?.facilities)) {
        const myFac = facsRes.value.facilities.find((f) => f.facility_id === user?.facility_id);
        if (myFac) setFacility(myFac);
      }

      if (refsRes.status === 'fulfilled' && Array.isArray(refsRes.value?.referrals)) {
        const facId = user?.facility_id;
        const myRefs = refsRes.value.referrals.filter((r) => {
          if (r.accepted_facility_id === facId || r.referring_facility_id === facId) return true;
          if (Array.isArray(r.target_hospitals)) {
            return r.target_hospitals.some((h) => (typeof h === 'string' ? h === facId : h?.facility_id === facId));
          }
          return false;
        });
        setReferrals(myRefs);
      }

      if (medRes.status === 'fulfilled' && Array.isArray(medRes.value?.medicines)) {
        setMedicines(medRes.value.medicines);
      }

      if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value?.doctors)) {
        setDoctors(docsRes.value.doctors);
      }
    } catch (err) {
      console.warn('Failed to load facility admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.facility_id) {
      loadDashboardData();
    }
  }, [user]);

  const handleDecision = async (referralId, decision, reason = '') => {
    try {
      await api.decideReferral(referralId, {
        status: decision,
        reason,
        hospital_id: user?.facility_id
      });
      setActionMessage(`Referral ${referralId} ${decision.toLowerCase()} successfully.`);
      setTimeout(() => setActionMessage(''), 4000);
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update referral decision');
    }
  };

  const handleDoctorStatusChange = async (doctorUserId, newStatus) => {
    try {
      await api.updateDoctorAvailability(doctorUserId, { availability_status: newStatus });
      setActionMessage(`Doctor availability updated to ${newStatus}`);
      setTimeout(() => setActionMessage(''), 4000);
      loadDashboardData();
    } catch (err) {
      alert(err.message || 'Failed to update doctor availability');
    }
  };

  const incomingPendingRefs = referrals.filter((r) => r.status !== 'ACCEPTED' && r.status !== 'REJECTED');
  const availableDocCount = doctors.filter((d) => (d.availability_status || 'AVAILABLE') === 'AVAILABLE').length;

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
              {t('facility')}: <strong>{facility?.name || user?.facility_name || 'District Hospital'}</strong> ({user?.facility_id || 'FAC-103'}) • {t('district')}: {user?.district || 'Pune'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link to="/facility-admin/referrals" className="gov-btn gov-btn-saffron">
              <GitPullRequest size={18} />
              <span>{t('referralInbox')} ({incomingPendingRefs.length})</span>
            </Link>
            <Link to="/facility-admin/medicines" className="gov-btn gov-btn-secondary">
              <Pill size={18} />
              <span>{t('medicineStock')}</span>
            </Link>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div className="gov-card" style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} />
          {actionMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid-stats">
        <div className="stat-card">
          <div>
            <div className="stat-value">{availableDocCount} / {doctors.length}</div>
            <div className="stat-label">{t('doctorAvailability')}</div>
          </div>
          <UserCheck style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{medicines.filter((m) => m.status === 'LOW_STOCK' || m.status === 'CRITICAL' || m.status === 'OUT_OF_STOCK').length}</div>
            <div className="stat-label">{t('medicineAlerts')}</div>
          </div>
          <AlertTriangle style={{ color: '#DC2626' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">
              {facility?.available_beds ?? (facility?.active_beds !== undefined ? Math.max(0, facility.active_beds - (facility.occupied_beds || 0)) : 0)} / {facility?.active_beds ?? 0}
            </div>
            <div className="stat-label">{t('availableBeds')}</div>
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
        {/* Incoming Referral Coordination Inbox Panel */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <GitPullRequest size={20} />
              <span>{t('referralInbox')} ({user?.facility_id})</span>
            </div>
            <Link to="/facility-admin/referrals" style={{ fontSize: '0.8125rem', color: '#1E40AF', fontWeight: '600' }}>
              {t('viewAll')}
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {referrals.length > 0 ? (
              referrals.slice(0, 5).map((ref) => (
                <div key={ref.referral_id || ref._id} style={{ padding: '0.75rem', border: '1px solid #E2E8F0', borderRadius: '8px', backgroundColor: ref.status === 'SENT' ? '#FFFBEB' : '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0F2C59' }}>
                      {ref.patient_name || ref.patient_id} ({translateSpecialty(ref.specialty_required)})
                    </div>
                    <StatusBadge status={ref.status || 'SENT'} />
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569', marginBottom: '0.5rem' }}>
                    {t('referredFrom')}: <strong>{ref.referring_facility_name || ref.referring_facility_id || 'PHC'}</strong> • {t('priority')}: {translatePriority(ref.priority || 'NORMAL')}
                    <br />
                    {t('clinicalNote')}: {ref.clinical_notes || 'N/A'}
                  </div>

                  {ref.status !== 'ACCEPTED' && ref.status !== 'REJECTED' && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <button
                        className="gov-btn gov-btn-primary gov-btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => handleDecision(ref.referral_id, 'ACCEPTED')}
                      >
                        <CheckCircle2 size={14} /> {t('accept')}
                      </button>
                      <button
                        className="gov-btn gov-btn-secondary gov-btn-sm"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => {
                          const reason = window.prompt('Reason for rejection');
                          if (reason !== null) {
                            handleDecision(ref.referral_id, 'REJECTED', reason);
                          }
                        }}
                      >
                        <XCircle size={14} /> {t('reject')}
                      </button>
                    </div>
                  )}

                  {ref.status === 'ACCEPTED' && (
                    <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700', marginTop: '0.375rem' }}>
                      ✓ Accepted by {ref.accepted_by_name || ref.accepted_facility_name || 'Admin'} {ref.accepted_at ? `on ${new Date(ref.accepted_at).toLocaleString('en-IN')}` : ''}
                    </div>
                  )}

                  {ref.status === 'REJECTED' && (
                    <div style={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: '700', marginTop: '0.375rem' }}>
                      ✗ Rejected. Reason: {ref.decision_reason || 'N/A'}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No incoming referrals in queue for this facility.
              </div>
            )}
          </div>
        </div>

        {/* Doctor Availability Section */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Stethoscope size={20} />
              <span>{t('doctorAvailability')} ({user?.facility_id})</span>
            </div>
            <Link to="/facility-admin/resources" style={{ fontSize: '0.8125rem', color: '#1E40AF', fontWeight: '600' }}>
              {t('viewAll')}
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {doctors.length > 0 ? (
              doctors.map((doc) => (
                <div key={doc.user_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                  <div>
                    <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0F172A' }}>{doc.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {translateSpecialty(doc.specialty || 'General Physician')} • {doc.phone || 'No phone'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <select
                      className="gov-select"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', height: 'auto' }}
                      value={doc.availability_status || 'AVAILABLE'}
                      onChange={(e) => handleDoctorStatusChange(doc.user_id, e.target.value)}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="BUSY">BUSY</option>
                      <option value="ON LEAVE">ON LEAVE</option>
                      <option value="OFFLINE">OFFLINE</option>
                      <option value="STANDBY">STANDBY</option>
                    </select>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No doctors assigned to this facility.
              </div>
            )}
          </div>
        </div>

        {/* Medicine Inventory Threshold Alerts */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Pill size={20} />
              <span>{t('medicineAlertsTitle')} ({user?.facility_id})</span>
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
                      {t('stockLabel')}: {med.current_stock} {med.unit || 'units'} (Min: {med.min_safety_stock || 10})
                    </div>
                  </div>
                  <StatusBadge status={med.status || 'AVAILABLE'} />
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No medicine inventory alerts on record for this facility.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
