import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { api } from '../../services/api';
import { MOCK_FACILITIES } from '../../mockData';
import { Calendar, GitPullRequest, FileText, MapPin, Clock } from 'lucide-react';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { t, translateSpecialty, translateFacilityType } = useLanguage();

  const [appointments, setAppointments] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPatientData = async () => {
      try {
        const [aptsRes, refsRes, rxRes, fupRes] = await Promise.allSettled([
          api.appointments(),
          api.referrals(),
          api.prescriptions(),
          api.followups()
        ]);
        if (!isMounted) return;
        setAppointments(aptsRes.status === 'fulfilled' && Array.isArray(aptsRes.value?.appointments) ? aptsRes.value.appointments : []);
        setReferrals(refsRes.status === 'fulfilled' && Array.isArray(refsRes.value?.referrals) ? refsRes.value.referrals : []);
        setPrescriptions(rxRes.status === 'fulfilled' && Array.isArray(rxRes.value?.prescriptions) ? rxRes.value.prescriptions : []);
        setFollowups(fupRes.status === 'fulfilled' && Array.isArray(fupRes.value?.followups) ? fupRes.value.followups : []);
      } catch (err) {
        console.warn('Failed to load patient dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchPatientData();
    return () => { isMounted = false; };
  }, [user]);

  const referral = referrals[0];
  const appointment = appointments[0];
  const prescription = prescriptions[0];

  return (
    <div>
      {/* Welcome Banner */}
      <div
        className="gov-card"
        style={{
          backgroundColor: '#0F2C59',
          color: '#ffffff',
          marginBottom: '1.5rem',
          backgroundImage: 'linear-gradient(135deg, #0F2C59 0%, #1E40AF 100%)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.8125rem', color: '#F59E0B', fontWeight: '700', textTransform: 'uppercase' }}>
              {t('citizenHealthcarePortal')}
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginTop: '0.25rem' }}>
              {t('greeting_good_morning')}, {user?.name || 'Valued Citizen'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
              {t('identifier')}: <strong>{user?.patient_id || user?.user_id || 'PAT-NEW'}</strong> • {t('village')}: {user?.village || 'General'}, {user?.district || 'Pune'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Stats Overview */}
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
            <div className="stat-value">{referrals.length}</div>
            <div className="stat-label">{t('referralStatus')}</div>
          </div>
          <GitPullRequest style={{ color: '#D97706' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{prescriptions.length}</div>
            <div className="stat-label">{t('prescriptions')}</div>
          </div>
          <FileText style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">{followups.length}</div>
            <div className="stat-label">{t('followups')}</div>
          </div>
          <Clock style={{ color: '#6B21A8' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {/* Active Referral Status Card */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <GitPullRequest size={20} />
              <span>{t('activeReferralStatus')}</span>
            </div>
            {referral ? <StatusBadge status={referral.status} /> : <span style={{ fontSize: '0.75rem', color: '#64748B' }}>None</span>}
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            {referral ? (
              <>
                <div style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <div style={{ fontWeight: '700', color: '#065F46' }}>
                    {t('targetHospital')}: {referral.accepted_facility_name || referral.accepted_hospital || referral.target_hospitals?.[0]?.facility || 'Pending Match'}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#047857', marginTop: '0.25rem' }}>
                    {t('specialtyLabel')}: {translateSpecialty(referral.specialty_required)}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#475569' }}>
                  <div><strong>{t('referringFacility')}:</strong> {referral.referring_facility_name || 'Health Centre'}</div>
                  <div><strong>{t('healthWorkerNotes')}:</strong> {referral.clinical_notes || 'N/A'}</div>
                  <div><strong>{t('referralPriority')}:</strong> <StatusBadge status={referral.priority || 'NORMAL'} /></div>
                </div>
              </>
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No active hospital referrals on record.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Appointment Card */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Calendar size={20} />
              <span>{t('upcomingAppointment')}</span>
            </div>
            {appointment ? <StatusBadge status={appointment.status} /> : <span style={{ fontSize: '0.75rem', color: '#64748B' }}>None</span>}
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            {appointment ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0F2C59' }}>{appointment.doctor_name || 'Attending Doctor'}</div>
                    <div style={{ color: '#64748B' }}>{appointment.facility_name || 'PHC Mulshi'}</div>
                  </div>
                  <div style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '0.5rem 0.875rem', borderRadius: '8px', fontWeight: '800', textAlign: 'center' }}>
                    {t('token')}<br/>{appointment.token_number || '#1'}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', color: '#334155', fontSize: '0.8125rem', backgroundColor: '#F8FAFC', padding: '0.625rem', borderRadius: '6px' }}>
                  <div><strong>{t('date')}:</strong> {appointment.date || 'Today'}</div>
                  <div><strong>{t('time')}:</strong> {appointment.time || '10:00 AM'}</div>
                  <div><strong>{t('typeLabel')}:</strong> {appointment.type || 'OPD'}</div>
                </div>
              </>
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No upcoming appointments scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Digital Prescription Summary */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <FileText size={20} />
              <span>{t('currentPrescriptions')}</span>
            </div>
            {prescription && <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{prescription.doctor_name || 'Attending Physician'}</span>}
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            {prescription && Array.isArray(prescription.items) && prescription.items.length > 0 ? (
              prescription.items.map((item, idx) => (
                <div key={idx} style={{ padding: '0.625rem 0', borderBottom: idx < prescription.items.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                  <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.medicine_name}</div>
                  <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                    {item.dosage} • {item.frequency} • {item.duration}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>{item.instructions}</div>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 0', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                No active prescriptions found.
              </div>
            )}
          </div>
        </div>

        {/* Nearby Available Government Healthcare Services */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <MapPin size={20} />
              <span>{t('nearbyFacilities')}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {MOCK_FACILITIES.slice(0, 3).map((fac) => (
              <div key={fac.facility_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.875rem', color: '#0F2C59' }}>{fac.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{translateFacilityType(fac.type)} • {t('distanceLabel')}: {fac.distance_km}</div>
                </div>
                <StatusBadge status={fac.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

