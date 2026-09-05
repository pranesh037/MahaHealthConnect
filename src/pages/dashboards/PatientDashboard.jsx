import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MOCK_APPOINTMENTS, MOCK_REFERRALS, MOCK_PRESCRIPTIONS, MOCK_FACILITIES } from '../../mockData';
import { Calendar, GitPullRequest, FileText, MapPin, Clock, Shield } from 'lucide-react';

export const PatientDashboard = () => {
  const { user } = useAuth();
  const { t, translateSpecialty, translateFacilityType } = useLanguage();
  const appointment = MOCK_APPOINTMENTS[0];
  const referral = MOCK_REFERRALS[0];
  const prescription = MOCK_PRESCRIPTIONS[0];

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
              {t('greeting_good_morning')}, {user?.name || 'Ramesh Patil'}
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#CBD5E1', marginTop: '0.25rem' }}>
              {t('identifier')}: <strong>{user?.patient_id || 'PAT-10245'}</strong> • {t('village')}: {user?.village || 'Mulshi Gaon'}, {user?.district || 'Pune'}
            </p>
          </div>
        </div>
      </div>

      {/* Grid Stats Overview */}
      <div className="grid-stats">
        <div className="stat-card">
          <div>
            <div className="stat-value">1</div>
            <div className="stat-label">{t('appointments')}</div>
          </div>
          <Calendar style={{ color: '#1E40AF' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">1</div>
            <div className="stat-label">{t('referralStatus')}</div>
          </div>
          <GitPullRequest style={{ color: '#D97706' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">1</div>
            <div className="stat-label">{t('prescriptions')}</div>
          </div>
          <FileText style={{ color: '#059669' }} />
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-value">3 days</div>
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
            <StatusBadge status={referral.status} />
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            <div style={{ marginBottom: '0.75rem', padding: '0.75rem', backgroundColor: '#ECFDF5', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
              <div style={{ fontWeight: '700', color: '#065F46' }}>
                {t('targetHospital')}: {referral.accepted_hospital}
              </div>
              <div style={{ fontSize: '0.8125rem', color: '#047857', marginTop: '0.25rem' }}>
                {t('specialtyLabel')}: {translateSpecialty(referral.specialty_required)} • {t('distanceLabel')}: 18.0 km
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', color: '#475569' }}>
              <div><strong>{t('referringFacility')}:</strong> {referral.referring_facility_name}</div>
              <div><strong>{t('healthWorkerNotes')}:</strong> {referral.clinical_notes}</div>
              <div><strong>{t('referralPriority')}:</strong> <StatusBadge status={referral.priority} /></div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointment Card */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <Calendar size={20} />
              <span>{t('upcomingAppointment')}</span>
            </div>
            <StatusBadge status={appointment.status} />
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#0F2C59' }}>{appointment.doctor_name}</div>
                <div style={{ color: '#64748B' }}>{appointment.facility_name}</div>
              </div>
              <div style={{ backgroundColor: '#EFF6FF', color: '#1E40AF', padding: '0.5rem 0.875rem', borderRadius: '8px', fontWeight: '800', textAlign: 'center' }}>
                {t('token')}<br/>{appointment.token_number}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', color: '#334155', fontSize: '0.8125rem', backgroundColor: '#F8FAFC', padding: '0.625rem', borderRadius: '6px' }}>
              <div><strong>{t('date')}:</strong> {appointment.date}</div>
              <div><strong>{t('time')}:</strong> {appointment.time}</div>
              <div><strong>{t('typeLabel')}:</strong> {appointment.type}</div>
            </div>
          </div>
        </div>

        {/* Digital Prescription Summary */}
        <div className="gov-card">
          <div className="gov-card-header">
            <div className="gov-card-title">
              <FileText size={20} />
              <span>{t('currentPrescriptions')}</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Dr. Aniket Deshmukh</span>
          </div>

          <div style={{ fontSize: '0.875rem' }}>
            {prescription.items.map((item, idx) => (
              <div key={idx} style={{ padding: '0.625rem 0', borderBottom: idx < prescription.items.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                <div style={{ fontWeight: '700', color: '#0F172A' }}>{item.medicine_name}</div>
                <div style={{ fontSize: '0.8125rem', color: '#475569' }}>
                  {item.dosage} • {item.frequency} • {item.duration}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>{item.instructions}</div>
              </div>
            ))}
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
