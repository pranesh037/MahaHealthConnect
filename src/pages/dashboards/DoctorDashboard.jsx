import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import { Stethoscope, ClipboardList, ShieldCheck, FileText, AlertOctagon, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { t, translateSpecialty, translateStatus } = useLanguage();

  const [appointments, setAppointments] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDoctorData = async () => {
      try {
        const [aptsRes, refsRes] = await Promise.allSettled([
          api.appointments(),
          api.referrals()
        ]);
        if (!isMounted) return;
        setAppointments(aptsRes.status === 'fulfilled' && Array.isArray(aptsRes.value?.appointments) ? aptsRes.value.appointments : []);
        setReferrals(refsRes.status === 'fulfilled' && Array.isArray(refsRes.value?.referrals) ? refsRes.value.referrals : []);
      } catch (err) {
        console.warn('Failed to load doctor dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDoctorData();
    return () => { isMounted = false; };
  }, [user]);

  const highPriorityCount = referrals.filter(r => r.priority === 'HIGH' || r.priority === 'CRITICAL' || r.priority === 'EMERGENCY').length;

  return (
    <div>
      {/* Welcome & RBAC Security Clearance Banner */}
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
              {t('specialistOpdPortal')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>
              {user?.name || 'Dr. Specialist'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
              {t('specialtyLabel')}: <strong>{translateSpecialty(user?.specialty || 'General Medicine')}</strong> • {t('facility')}: {user?.facility_name || 'District Hospital'}
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '0.625rem 1rem',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '0.8125rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: '#86EFAC' }}>
              <ShieldCheck size={16} />
              <span>{t('rbacClearance')}</span>
            </div>
            <div style={{ color: '#CBD5E1', fontSize: '0.75rem', marginTop: '0.125rem' }}>
              Doctor Scope: {user?.user_id || 'USR-DOC'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid-stats">
        <div className="stat-card">
          <div>
            <div className="stat-value">{appointments.length}</div>
            <div className="stat-label">{t('appointments')}</div>
          </div>
          <Calendar style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{appointments.length}</div>
            <div className="stat-label">{t('queue')}</div>
          </div>
          <ClipboardList style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{highPriorityCount}</div>
            <div className="stat-label">{t('highPriority')}</div>
          </div>
          <AlertOctagon style={{ color: '#DC2626' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{referrals.length}</div>
            <div className="stat-label">{t('referrals')}</div>
          </div>
          <Stethoscope style={{ color: '#D97706' }} />
        </div>
      </div>

      {/* RBAC Patient Access Banner Demonstration */}
      <div
        style={{
          padding: '1rem',
          backgroundColor: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderRadius: '10px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldCheck size={24} style={{ color: '#1E40AF' }} />
          <div>
            <div style={{ fontWeight: '700', color: '#1E3A8A', fontSize: '0.9375rem' }}>
              {t('accessPolicy')}
            </div>
            <div style={{ fontSize: '0.8125rem', color: '#1E40AF' }}>
              {t('authorizedRecordsVisibleNotice')}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', fontWeight: '700' }}>
          <span style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
            {t('permissionReadPrescription')}
          </span>
          <span style={{ backgroundColor: '#DCFCE7', color: '#14532D', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>
            {t('auditLogged')}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* OPD Consultation Queue */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <ClipboardList size={20} />
              <span>{t('consultationQueue')}</span>
            </div>
            <Link to="/doctor/queue" style={{ fontSize: '0.8125rem', color: '#1E40AF', fontWeight: '600' }}>
              {t('fullQueue')}
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {appointments.length > 0 ? (
              appointments.map((apt) => (
                <div
                  key={apt.appointment_id || apt._id}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '0.9375rem', color: '#0F2C59' }}>
                        {t('token')} {apt.token_number || '#1'}: {apt.patient_name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                        {t('identifier')}: {apt.patient_id} • {t('time')}: {apt.time || 'Today'} • {t('type')}: {apt.type || 'OPD'}
                      </div>
                    </div>
                    <StatusBadge status={apt.triage_priority || 'ROUTINE'} />
                  </div>

                  <div style={{ marginTop: '0.625rem', display: 'flex', gap: '0.5rem' }}>
                    <Link to="/doctor/prescription" className="gov-btn gov-btn-primary gov-btn-sm">
                      <FileText size={14} />
                      <span>{t('createPrescriptionAction')}</span>
                    </Link>
                    <Link to="/doctor/diagnostics" className="gov-btn gov-btn-secondary gov-btn-sm">
                      <span>{t('orderDiagnostic')}</span>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No OPD appointments scheduled in your queue.
              </div>
            )}
          </div>
        </div>

        {/* Emergency & High Priority Referral Cases */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <AlertOctagon size={20} style={{ color: '#DC2626' }} />
              <span>{t('emergencyReferralReview')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {referrals.length > 0 ? (
              referrals.map((ref) => (
                <div key={ref.referral_id || ref._id} style={{ padding: '0.75rem', border: '1px solid #FCA5A5', borderRadius: '8px', backgroundColor: '#FEF2F2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.375rem' }}>
                    <span style={{ fontWeight: '800', color: '#7F1D1D', fontSize: '0.875rem' }}>
                      {ref.patient_name} ({ref.age || 45} {t('yearsShort')})
                    </span>
                    <StatusBadge status={ref.priority || 'NORMAL'} />
                  </div>

                  <div style={{ fontSize: '0.8125rem', color: '#991B1B', marginBottom: '0.5rem' }}>
                    <strong>{t('referredFrom')}:</strong> {ref.referring_facility_name || 'PHC'}<br/>
                    <strong>{t('clinicalNote')}:</strong> {ref.clinical_notes || 'N/A'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#7F1D1D', borderTop: '1px solid #FECACA', paddingTop: '0.375rem' }}>
                    <span>{t('status')}: <strong>{translateStatus(ref.status || 'SENT')}</strong></span>
                    <Link to="/doctor/referrals" style={{ fontWeight: '700', color: '#1E40AF', textDecoration: 'none' }}>
                      {t('viewCaseFile')} →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No emergency referrals pending review.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

